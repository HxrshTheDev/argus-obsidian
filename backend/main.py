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

    email_count = 0
    phone_count = 0

    def replace_email(match):
        nonlocal email_count
        email_count += 1
        return f"[EMAIL_{email_count}]"

    def replace_phone(match):
        nonlocal phone_count
        phone_count += 1
        return f"[PHONE_{phone_count}]"

    masked = re.sub(r'[\w\.-]+@[\w\.-]+', replace_email, text)
    masked = re.sub(r'\d{10}', replace_phone, masked)

    total = email_count + phone_count

    return {
        "masked": masked,
        "count": total,
        "improved": masked
    }
