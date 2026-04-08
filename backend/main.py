"""
ARGUS Obsidian — FastAPI entrypoint (server root).

Run from `server/`:
  pip install -r requirements.txt
  uvicorn main:app --reload --host 127.0.0.1 --port 8000

Optional (stronger NER): python -m spacy download en_core_web_lg

Detection and masking use Microsoft Presidio (AnalyzerEngine). Optional OpenAI
step improves masked text, then placeholders are restored locally.
"""

from __future__ import annotations

import logging
import os
import re
from functools import lru_cache
from pathlib import Path

# Presidio → tldextract: use a project-local cache (writable in CI/sandboxes)
_tld_cache = Path(__file__).resolve().parent / ".cache" / "tldextract"
_tld_cache.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("TLDEXTRACT_CACHE", str(_tld_cache))

from app.presidio_engine import create_analyzer
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.pipeline import risk_level, unmask_text

load_dotenv()

logger = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "New Folder With Items"

app = FastAPI(title="ARGUS Obsidian API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProcessRequest(BaseModel):
    text: str = Field(..., max_length=100_000)
    instruction: str | None = Field(
        default=None,
        max_length=4_000,
        description="Optional user goal, e.g. improve clarity (sent to the model on masked text only).",
    )


class ProcessResponse(BaseModel):
    findings: list[dict]
    risk: str
    masked_text: str
    improved_masked: str | None = None
    restored_text: str | None = None
    used_llm: bool
    llm_error: str | None = None


def _normalize_entity_type(entity_type: str) -> str:
    safe = re.sub(r"[^\w]+", "_", entity_type.upper()).strip("_")
    return safe or "ENTITY"


def _resolve_non_overlapping(
    text: str,
    results: list,
) -> list[tuple[int, int, str, str]]:
    """Presidio hits can overlap; keep a greedy set (earlier start, longer span, higher score)."""
    spans: list[tuple[int, int, str, str, float]] = []
    for r in results:
        spans.append((r.start, r.end, r.entity_type, text[r.start : r.end], float(r.score)))
    spans.sort(key=lambda s: (s[0], -(s[1] - s[0]), -s[4]))
    selected: list[tuple[int, int, str, str]] = []
    last_end = -1
    for start, end, et, val, _sc in spans:
        if start < last_end:
            continue
        selected.append((start, end, et, val))
        last_end = end
    selected.sort(key=lambda s: s[0])
    return selected


def presidio_mask(text: str, analyzer) -> tuple[str, dict[str, str], list[dict]]:
    results = analyzer.analyze(text=text, language="en")
    spans = _resolve_non_overlapping(text, results)
    counters: dict[str, int] = {}
    ph_to_secret: dict[str, str] = {}
    applied: list[tuple[int, int, str, str]] = []
    findings: list[dict] = []

    for start, end, entity_type, value in spans:
        key = _normalize_entity_type(entity_type)
        counters[key] = counters.get(key, 0) + 1
        ph = f"[{key}_{counters[key]}]"
        ph_to_secret[ph] = value
        applied.append((start, end, ph, value))
        findings.append({"type": entity_type, "value": value, "index": start})

    out = text
    for start, end, ph, _val in reversed(applied):
        out = out[:start] + ph + out[end:]

    return out, ph_to_secret, findings


@lru_cache(maxsize=1)
def get_analyzer():
    return create_analyzer()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/process", response_model=ProcessResponse)
async def process(body: ProcessRequest) -> ProcessResponse:
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    try:
        analyzer = get_analyzer()
        masked, ph_map, findings = presidio_mask(text, analyzer)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Presidio processing failed")
        raise HTTPException(
            status_code=500,
            detail="Presidio processing failed. Check server logs.",
        ) from exc

    rlevel = risk_level(len(findings))

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return ProcessResponse(
            findings=findings,
            risk=rlevel,
            masked_text=masked,
            improved_masked=None,
            restored_text=None,
            used_llm=False,
            llm_error="OPENAI_API_KEY is not set; only Presidio masking was performed.",
        )

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=api_key)
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        user_instruction = (body.instruction or "").strip() or (
            "Improve the text for clarity and tone while preserving meaning."
        )
        sys_prompt = (
            "You are a writing assistant. The user message contains PLACEHOLDERS like [EMAIL_ADDRESS_1] "
            "that stand in for sensitive data. You MUST copy every such placeholder exactly "
            "in your reply — never replace them with real-looking emails, phone numbers, or secrets. "
            "Do not invent PII. Reply with improved text only, no preamble."
        )
        completion = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": sys_prompt},
                {
                    "role": "user",
                    "content": f"{user_instruction}\n\n---\n{masked}\n---",
                },
            ],
            temperature=0.3,
            timeout=60.0,
        )
        choice = completion.choices[0].message.content
        improved_masked = (choice or "").strip()
        restored = unmask_text(improved_masked, ph_map)
        return ProcessResponse(
            findings=findings,
            risk=rlevel,
            masked_text=masked,
            improved_masked=improved_masked,
            restored_text=restored,
            used_llm=True,
            llm_error=None,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM request failed: %s", exc)
        return ProcessResponse(
            findings=findings,
            risk=rlevel,
            masked_text=masked,
            improved_masked=None,
            restored_text=None,
            used_llm=False,
            llm_error="LLM request failed; masked output is still available.",
        )


if FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")
