from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import re

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
        ("API_KEY",  r"(?:sk|pk)-[A-Za-z0-9]{20,}|pk_[A-Za-z0-9]{20,}", re.IGNORECASE),
        ("SECRET",   r"(?:api[-]?key|token|secret)\s*[:=]\s*[A-Za-z0-9-]{10,}", re.IGNORECASE),
        ("TOKEN",    r"Bearer\s+[A-Za-z0-9-._~+/]+=*", re.IGNORECASE),
        ("TOKEN",    r"[A-Za-z0-9_-]{20,}", 0),
        ("PASSWORD", r"(?:password|pwd|pass)\s*[:=]\s*\S+", re.IGNORECASE),
        ("EMAIL",    r"[\w.-]+@[\w.-]+", 0),
        ("PHONE",    r"\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}", 0),
        ("ADDRESS",  r"\d{1,5}\s\w+\s(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Blvd)", re.IGNORECASE),
        ("ID",       r"\d{6,}", 0),
        ("NAME",     r"[A-Z][a-z]+\s[A-Z][a-z]+", 0)
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

    return {
        "masked": current_text,
        "count": len(matches),
        "improved": current_text
    }

