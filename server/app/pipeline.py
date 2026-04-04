"""
Detection, masking, and restoration — aligned with the frontend regex set.
No persistence: maps exist only for the lifetime of one request.
"""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass

# Order matters for overlap resolution: earlier types win at the same start position.
PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("email", re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")),
    ("phone", re.compile(r"(?:\+1|\b1)?[-.]?(?:\d{3})[-.]?(?:\d{3})[-.]?(?:\d{4})\b")),
    ("ssn", re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    ("creditCard", re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b")),
    ("apiKey", re.compile(r"[a-zA-Z0-9]{32,}")),
]


@dataclass(frozen=True)
class Finding:
    type: str
    value: str
    index: int


def detect_sensitive_data(text: str) -> list[Finding]:
    findings: list[Finding] = []
    for name, pattern in PATTERNS:
        for m in pattern.finditer(text):
            findings.append(Finding(type=name, value=m.group(0), index=m.start()))
    findings.sort(key=lambda f: f.index)
    return findings


def risk_level(finding_count: int) -> str:
    if finding_count == 0:
        return "LOW"
    if finding_count <= 2:
        return "MEDIUM"
    return "HIGH"


def _collect_non_overlapping_spans(text: str) -> list[tuple[int, int, str, str]]:
    """Return (start, end, type, value) spans that do not overlap."""
    raw: list[tuple[int, int, str, str, int]] = []
    for type_priority, (name, pattern) in enumerate(PATTERNS):
        for m in pattern.finditer(text):
            raw.append((m.start(), m.end(), name, m.group(0), type_priority))

    # Prefer earlier start, then longer match, then earlier pattern order.
    raw.sort(key=lambda x: (x[0], -(x[1] - x[0]), x[4]))

    selected: list[tuple[int, int, str, str]] = []
    last_end = -1
    for start, end, name, value, _ in raw:
        if start < last_end:
            continue
        selected.append((start, end, name, value))
        last_end = end

    selected.sort(key=lambda x: x[0])
    return selected


def mask_text(text: str) -> tuple[str, dict[str, str]]:
    """
    Replace sensitive spans with unique placeholders [TYPE_N].
    Returns (masked_text, placeholder_to_secret).
    """
    spans = _collect_non_overlapping_spans(text)
    counters: dict[str, int] = defaultdict(int)
    ph_to_secret: dict[str, str] = {}
    applied: list[tuple[int, int, str, str]] = []
    for start, end, name, value in spans:
        counters[name] += 1
        ph = f"[{name.upper()}_{counters[name]}]"
        ph_to_secret[ph] = value
        applied.append((start, end, ph, value))

    result = text
    for start, end, ph, _val in reversed(applied):
        result = result[:start] + ph + result[end:]

    return result, ph_to_secret


def unmask_text(text: str, placeholder_to_secret: dict[str, str]) -> str:
    """Restore secrets; longest placeholders first to avoid partial collisions."""
    if not placeholder_to_secret:
        return text
    out = text
    for ph in sorted(placeholder_to_secret.keys(), key=len, reverse=True):
        out = out.replace(ph, placeholder_to_secret[ph])
    return out


def findings_from_spans(text: str) -> list[Finding]:
    findings: list[Finding] = []
    for start, end, name, value in _collect_non_overlapping_spans(text):
        findings.append(Finding(type=name, value=value, index=start))
    return findings
