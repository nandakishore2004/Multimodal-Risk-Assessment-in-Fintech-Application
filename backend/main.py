"""FastAPI migration layer for the NeoRisk Lending platform.

The existing PyTorch/Whisper models remain in ``app.py`` during this migration
phase. This API exposes them through typed FastAPI routes so the Next.js client
is independent from the Flask-rendered UI.

Run with:
    uvicorn backend.main:api --reload --port 8000
"""
from __future__ import annotations

import io
import sys
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Compatibility adapter: model initialization and decision logic remain
# centralized in the legacy module until they are split into services.
from app import (
    app as legacy_app,
    assess_loan,
    assess_risk,
    get_wallet,
    health,
    kyc_analyze,
    login,
    model_info,
    process_payment,
    voice_analyze,
)

api = FastAPI(
    title="NeoRisk Lending API",
    version="2.0.0",
    description=(
        "Multimodal loan risk assessment — ViT-B/16 · DeBERTa-v3 · "
        "Whisper (Telugu) · FT-Transformer · Cross-Attention Fusion"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

api.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Request Models ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class LoanApplication(BaseModel):
    applicant_name: str = Field(min_length=1, max_length=80)
    monthly_income: float = Field(gt=0)
    monthly_obligations: float = Field(ge=0)
    credit_score: int = Field(ge=300, le=900)
    loan_amount: float = Field(gt=0)
    tenure_months: int = Field(ge=12, le=60)
    employment_years: float = Field(ge=0)
    missed_emis: int = Field(ge=0, le=12)
    reference_risk: float = Field(ge=0, le=100)
    purpose: str = ""
    voice_transcript: str = ""
    has_kyc: bool = False
    kyc_fraud_prob: Optional[float] = Field(default=None, ge=0, le=1)
    demo_force_fake_image: bool = False
    demo_force_suspicious_voice: bool = False


class TransactionData(BaseModel):
    step: int = 1
    type: int = 4
    amount: float = 0
    oldbalanceOrg: float = 0
    oldbalanceDest: float = 0


class AssessRiskRequest(BaseModel):
    has_image: bool = False
    kyc_fraud_prob: Optional[float] = Field(default=None, ge=0, le=1)
    demo_force_fake_image: bool = False
    has_voice: bool = False
    voice_transcript: str = ""
    demo_force_suspicious_voice: bool = False
    query_text: str = ""
    transaction: Optional[TransactionData] = None


class PaymentRequest(BaseModel):
    recipient_id: str
    recipient_name: str = ""
    amount: float = Field(gt=0)
    note: str = ""
    voice_transcript: str = ""
    has_voice: bool = False
    has_image: bool = False
    demo_force_fake_image: bool = False
    demo_force_suspicious_voice: bool = False


# ─── Helper ───────────────────────────────────────────────────────────────────

def _response(view):
    """Convert Flask view response → FastAPI response payload."""
    response, status = (view, 200) if not isinstance(view, tuple) else view
    body = response.get_json()
    if status >= 400:
        raise HTTPException(status_code=status, detail=body)
    return body


# ─── Routes ───────────────────────────────────────────────────────────────────

@api.get("/health", tags=["System"])
def health_check():
    """Model load status and device info."""
    with legacy_app.test_request_context("/api/health", method="GET"):
        return _response(health())


@api.get("/model/info", tags=["System"])
def get_model_info():
    """Architecture details, training stats, and dataset info for each model."""
    with legacy_app.test_request_context("/api/model_info", method="GET"):
        return _response(model_info())


@api.post("/auth/login", tags=["Auth"])
def authenticate(payload: LoginRequest):
    """Demo login — returns user profile on success."""
    with legacy_app.test_request_context(
        "/api/auth/login", method="POST", json=payload.model_dump()
    ):
        return _response(login())


@api.get("/wallet", tags=["Payments"])
def get_wallet_info():
    """Returns current user wallet balance and account profile."""
    with legacy_app.test_request_context("/api/wallet", method="GET"):
        return _response(get_wallet())


@api.post("/pay", tags=["Payments"])
def make_payment(payload: PaymentRequest):
    """
    GPay/PhonePe-style payment endpoint.
    Runs all 4 AI models in background — blocks/flags/approves the transfer.
    """
    with legacy_app.test_request_context(
        "/api/pay", method="POST", json=payload.model_dump()
    ):
        return _response(process_payment())


@api.post("/risk/assess", tags=["Risk"])
def assess_multimodal_risk(payload: AssessRiskRequest):
    """
    Raw multimodal risk assessment across all 4 modalities:
    ViT-B/16 · DeBERTa-v3 · Whisper · FT-Transformer → Cross-Attention Fusion.
    """
    data = payload.model_dump()
    if data.get("transaction"):
        data["transaction"] = payload.transaction.model_dump()
    with legacy_app.test_request_context(
        "/api/assess_risk", method="POST", json=data
    ):
        return _response(assess_risk())


@api.post("/loan/assess", tags=["Loans"])
def loan_assessment(payload: LoanApplication):
    """Full loan application assessment with bank recommendations."""
    with legacy_app.test_request_context(
        "/api/loan_assess", method="POST", json=payload.model_dump()
    ):
        return _response(assess_loan())


@api.post("/kyc/analyze", tags=["KYC"])
async def analyze_kyc(kyc_document: UploadFile = File(...)):
    """ViT-B/16 document tampering detection. Upload Aadhaar / PAN JPG or PNG."""
    try:
        contents = await kyc_document.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        from PIL import Image
        import torch

        try:
            image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Unable to read this document as an image: {e}",
            )

        vit_model = getattr(legacy_app, "vit_model", None)
        vit_transform = getattr(legacy_app, "vit_transform", None)
        device = getattr(legacy_app, "device", "cpu")
        vit_loaded = getattr(legacy_app, "VIT_REAL_LOADED", False)

        if vit_loaded and vit_model is not None and vit_transform is not None:
            tensor = vit_transform(image).unsqueeze(0).to(device)
            with torch.no_grad():
                probability = float(torch.softmax(vit_model(tensor), dim=1)[0, 1].item())
            risk = round(probability, 4)
            model_used = "ViT-B/16 KYC tampering detector"
        else:
            risk = 0.05
            model_used = "KYC validation fallback"

        return {
            "success": True,
            "fraud_prob": risk,
            "prediction": "TAMPERED / REVIEW REQUIRED" if risk > 0.5 else "DOCUMENT STRUCTURE ACCEPTED",
            "model_used": model_used,
            "guidance": (
                "The prototype only checks visual tampering patterns. "
                "A lender must still verify document ownership and identity."
            ),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KYC processing error: {e}")



# Global OCR Reader cache
_OCR_READER = None

@api.post("/kyc/ocr", tags=["KYC"])
async def kyc_ocr(kyc_document: UploadFile = File(...)):
    """Extract name, DOB, Aadhaar number, gender and address from Aadhaar card image using EasyOCR."""
    import re
    import numpy as np
    global _OCR_READER

    try:
        contents = await kyc_document.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        from PIL import Image

        try:
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            # Downscale image to speed up OCR significantly (max 1024x1024)
            image.thumbnail((1024, 1024))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Cannot read image: {e}")

        # Run EasyOCR (cached globally after first call)
        try:
            import easyocr
            if _OCR_READER is None:
                _OCR_READER = easyocr.Reader(["en", "hi"], gpu=False, verbose=False)
            import numpy as _np
            img_array = _np.array(image)
            raw_results = _OCR_READER.readtext(img_array, detail=0, paragraph=True)
            lines = [str(t).strip() for t in raw_results if str(t).strip()]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OCR error: {e}")

        full_text = " ".join(lines)

        # ── Parse Aadhaar fields ───────────────────────────────────────────

        # Gender
        gender = ""
        if re.search(r"(?i)(female)", full_text):
            gender = "Female"
        elif re.search(r"(?i)(male)", full_text):
            gender = "Male"

        # DOB: DD/MM/YYYY or DD-MM-YYYY or YOB
        dob_m = re.search(r"(?:DOB|Date of Birth|Birth|YOB).*?(\d{2}[/\- ]\d{2}[/\- ]\d{4}|\d{4})", full_text, re.IGNORECASE)
        if not dob_m:
            dob_m = re.search(r"(\d{2}[/\-]\d{2}[/\-]\d{4})", full_text)
        dob = dob_m.group(1).replace(" ", "/").replace("-", "/") if dob_m else ""

        # Aadhaar number (12-digit, may be masked)
        aadh_m = re.search(r"\b(\d{4}\s\d{4}\s\d{4}|\d{12}|[Xx]{4}\s[Xx]{4}\s\d{4})\b", full_text)
        aadhaar_num = aadh_m.group(1) if aadh_m else ""

        # Name: Find the first line that is purely english letters (not boilerplate)
        skip_pat = re.compile(
            r"(government|india|aadhaar|unique|identification|authority|uidai"
            r"|republic|bharat|aadhar|download|father|husband|dob|year|date|birth|male|female|address)",
            re.IGNORECASE,
        )
        name = ""
        for line in lines:
            s = line.strip()
            if re.search(r"\d", s): continue
            if skip_pat.search(s): continue
            if re.search(r"[:|\\/,\-]", s): continue
            # Must have letters only
            if len(s) > 3 and re.search(r"^[A-Za-z\s\.]+$", s):
                name = s.title()
                break

        # Address: lines after "Address" keyword
        address = ""
        addr_match = re.search(
            r"(?:Address|Addr|पता)[:\s]+(.+?)(?:[0-9]{6}|\Z)",
            full_text,
            re.IGNORECASE | re.DOTALL,
        )
        if addr_match:
            address = " ".join(addr_match.group(1).split())[:200]

        # Pincode
        pin_match = re.search(r"\b([1-9]\d{5})\b", full_text)
        pincode = pin_match.group(1) if pin_match else ""

        return {
            "success": True,
            "extracted": {
                "name": name,
                "dob": dob,
                "gender": gender,
                "aadhaar_number": aadhaar_num,
                "address": address,
                "pincode": pincode,
            },
            "raw_text": full_text,
            "confidence_note": "OCR is best-effort; always verify extracted data.",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KYC OCR error: {e}")

@api.post("/voice/analyze", tags=["Voice"])
async def analyze_voice(
    audio: Optional[UploadFile] = File(default=None),
    transcript: str = Form(default=""),
    language: str = Form(default=""),
):
    """Telugu / English Whisper ASR + NLP fraud-keyword detection."""
    import os
    import tempfile

    try:
        contents = await audio.read() if audio is not None else b""
        transcript_text = (transcript or "").strip()
        whisper_transcript = ""

        whisper_model = getattr(legacy_app, "whisper_model", None)
        if whisper_model and contents and len(contents) > 100:
            suffix = Path(audio.filename or "recording.webm").suffix or ".webm"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp_path = tmp.name
                tmp.write(contents)
            try:
                lang = language.strip().lower() if language else ""
                transcribe_kwargs = {"fp16": False}
                if lang in ("te", "telugu"):
                    transcribe_kwargs["language"] = "te"
                elif lang in ("en", "english"):
                    transcribe_kwargs["language"] = "en"
                result = whisper_model.transcribe(tmp_path, **transcribe_kwargs)
                whisper_transcript = result.get("text", "").strip()
            except Exception as e:
                print(f"[Whisper Error]: {e}")
            finally:
                if os.path.exists(tmp_path):
                    try:
                        os.unlink(tmp_path)
                    except OSError:
                        pass

        final_transcript = whisper_transcript or transcript_text

        suspicious_words = [
            "urgent", "password", "otp", "block", "unblock",
            "hacked", "stolen", "money", "transfer", "account",
        ]
        telugu_suspicious = [
            "అత్యవసరం", "పాస్‌వర్డ్", "ఓటీపీ", "బ్లాక్",
            "ఖాతా", "డబ్బులు", "బదిలీ", "దొంగతనం", "హ్యాక్",
        ]

        text_lower = final_transcript.lower()
        matched = [w for w in suspicious_words if w in text_lower] + [
            w for w in telugu_suspicious if w in final_transcript
        ]
        is_suspicious = len(matched) > 0

        fraud_prob = (
            min(0.95, 0.55 + len(matched) * 0.10)
            if is_suspicious
            else (0.08 if final_transcript else 0.12)
        )
        prediction = (
            "High-Risk Speech Pattern"
            if is_suspicious
            else ("Normal Speech" if final_transcript else "No Clear Speech")
        )

        return {
            "success": True,
            "final_transcript": final_transcript,
            "fraud_prob": fraud_prob,
            "prediction": prediction,
            "matched_keywords": matched,
            "model_used": "Whisper-small (Telugu fine-tuned)" if whisper_model else "NLP Regex",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice processing error: {e}")
