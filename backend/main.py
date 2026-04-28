from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import re
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Configure NVIDIA NIM client (Nemotron)
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
if NVIDIA_API_KEY:
    nim_client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=NVIDIA_API_KEY,
    )
else:
    nim_client = None

app = FastAPI()



# ===== CORS =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== REQUEST MODEL =====
class InputData(BaseModel):
    text: str

# ===== HEALTH CHECK =====
@app.get("/health")
def health():
    return {"status": "ok"}

# ===== MAIN PROCESS =====
@app.post("/process")
def process(data: InputData):
    text = data.text.strip()

    if not text:
        return {
            "masked": "",
            "count": 0,
            "improved": "No input provided"
        }

    # Tiered Detection Rules (Ordered by priority)
    RULES = [
        ("API_KEY",  r"\b[A-Za-z0-9_-]{20,}\b|\bsk-[A-Za-z0-9]{20,}\b|\bpk_[A-Za-z0-9]{20,}\b|\b(?:api[-]?key|token|secret)\s*[:=]\s*[A-Za-z0-9-]{10,}\b", re.IGNORECASE),
        ("TOKEN",    r"\bBearer\s+[A-Za-z0-9-._~+/]+=*\b", re.IGNORECASE),
        ("PASSWORD", r"\b(?:password|pwd|pass)\s*[:=]\s*\S+\b", re.IGNORECASE),
        ("CARD",     r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b", 0),
        ("URL_CRED", r"https?:\/\/[^\s:@]+:[^\s:@]+@[^\s\/:]+(?::\d+)?(?:\/[^\s]*)?", re.IGNORECASE),
        ("EMAIL",    r"[\w.-]+@[\w.-]+", 0),
        ("PHONE",    r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{10}\b", 0),
        ("ADDRESS",  r"\b\d{1,5}\s\w+\s(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Blvd)\b", re.IGNORECASE),
        ("ID",       r"\b\d{6,}\b", 0),
        ("NAME",     r"\b[A-Z][a-z]+\s[A-Z][a-z]+\b", 0)
    ]

    matches = []
    ranges = []

    for category, pattern, flags in RULES:
        for match in re.finditer(pattern, text, flags):
            start, end = match.span()
            
            # Check for overlap with higher priority matches
            if any(start < r_end and end > r_start for r_start, r_end in ranges):
                continue
                
            # Basic heuristic for Names (avoid address overlap / cities)
            if category == "NAME":
                common_cities = ["New", "San", "Los", "Santa"]
                if match.group().split()[0] in common_cities:
                    continue

            ranges.append((start, end))
            matches.append({
                "category": category,
                "value": match.group(),
                "start": start,
                "end": end
            })

    # Sort matches by start position for replacement
    matches.sort(key=lambda x: x["start"])

    # Perform replacement from right to left to keep indices valid
    current_text = text
    counters = {}
    for match in reversed(matches):
        cat = match["category"]
        counters[cat] = counters.get(cat, 0) + 1 # This is tricky for indices
        # We need to know the total count per type to index them correctly if going backwards
        # Actually, let's count them first
    
    # Redo: Count occurrences to assign correct indices [TYPE_n]
    type_occurrences = {}
    for match in matches:
        cat = match["category"]
        type_occurrences[cat] = type_occurrences.get(cat, 0) + 1
        match["index"] = type_occurrences[cat]

    # Replace from right to left
    for match in reversed(matches):
        placeholder = f"[{match['category']}_{match['index']}]"
        current_text = current_text[:match["start"]] + placeholder + current_text[match["end"]:]

    # ===== AI IMPROVEMENT LAYER (NVIDIA Nemotron) =====
    improved_text = current_text
    if nim_client and current_text.strip():
        try:
            prompt = (
                "Task: Provide a helpful, intelligent response to the following prompt.\n"
                "Constraint 1: You MUST PRESERVE all placeholders like [EMAIL_1], [PHONE_1], "
                "[API_KEY_1], etc. exactly format-wise.\n"
                "Constraint 2: Do NOT provide conversational preamble. Output a direct, seamless reply.\n\n"
                f"Prompt:\n{current_text}"
            )
            completion = nim_client.chat.completions.create(
                model="nvidia/nemotron-3-super-120b-a12b",
                messages=[{"role": "user", "content": prompt}],
                temperature=1,
                top_p=0.95,
                max_tokens=16384,
                extra_body={
                    "chat_template_kwargs": {"enable_thinking": True},
                    "reasoning_budget": 16384,
                },
                stream=True,
            )
            reply_parts = []
            for chunk in completion:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta.content:
                    reply_parts.append(delta.content)
            improved_text = "".join(reply_parts).strip() or current_text
        except Exception as e:
            print(f"AI Error: {e}")

    return {
        "masked": current_text,
        "count": len(matches),
        "improved": improved_text
    }


