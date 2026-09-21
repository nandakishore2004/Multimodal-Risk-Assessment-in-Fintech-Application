"""
backend/roboflow_service.py
────────────────────────────────────────────────────────────────────────────────
Roboflow Serverless Cloud API client for Aadhaar Card Entity Detection.
Model: aadhar-card-entity-detection/1  (Object Detection)

API key is loaded from the ROBOFLOW_API_KEY environment variable (set in .env).
The key is NEVER sent in the URL query string — it is sent via the
"Authorization: Bearer <key>" HTTP header (inference-sdk v1.5.0+ behaviour).

Pipeline:
  1. Upload KYC image → Roboflow detects entity bounding boxes per field
  2. Map numeric class IDs → human-readable field names
  3. Crop each detected region from the original PIL image
  4. Run EasyOCR on each crop to extract text for that specific field
  5. Return structured dict of extracted fields + raw detections for the UI
"""

from __future__ import annotations

import base64
import io
import os
import re
import time
from typing import Any

import numpy as np
import requests
from PIL import Image

# ── API configuration ────────────────────────────────────────────────────────

ROBOFLOW_API_URL  = "https://serverless.roboflow.com"
ROBOFLOW_MODEL_ID = "aadhar-card-entity-detection/1"

# Aadhaar card entity class-ID → field name mapping.
# Model `aadhar-card-entity-detection/1` was trained to detect front-side
# Aadhaar card regions.  The numeric IDs are the classes the model emits;
# we keep a best-effort map and fall back to the raw class string for any
# unknown IDs so the pipeline is forward-compatible.
CLASS_MAP: dict[str | int, str] = {
    "0": "aadhaar_number",
    "1": "name",
    "2": "dob",
    "3": "gender",
    "4": "address",
    "5": "photo",
    "6": "pincode",
    "7": "issue_date",
    # Named labels (some model versions use these directly)
    "aadhaar_number":  "aadhaar_number",
    "name":            "name",
    "dob":             "dob",
    "gender":          "gender",
    "address":         "address",
    "photo":           "photo",
    "pincode":         "pincode",
    "AadharName":      "name",
    "AadharDOB":       "dob",
    "AadharNumber":    "aadhaar_number",
    "Aadhar no":       "aadhaar_number",
    0: "aadhaar_number",
    1: "name",
    2: "dob",
    3: "gender",
    4: "address",
    5: "photo",
    6: "pincode",
    7: "issue_date",
}

# EasyOCR reader — lazily initialised once per process
_easyocr_reader: Any = None


def _get_ocr_reader() -> Any:
    global _easyocr_reader
    if _easyocr_reader is None:
        import easyocr
        print("[Roboflow] Initialising EasyOCR reader (en+hi) …")
        _easyocr_reader = easyocr.Reader(["en", "hi"], gpu=False, verbose=False)
        print("[Roboflow] EasyOCR ready.")
    return _easyocr_reader


def _get_api_key() -> str:
    key = os.environ.get("ROBOFLOW_API_KEY", "").strip()
    if not key:
        raise EnvironmentError(
            "ROBOFLOW_API_KEY not set. "
            "Add it to your .env file or set the environment variable."
        )
    return key


def _encode_image(image: Image.Image, max_side: int = 1024) -> str:
    """Resize image to ≤ max_side px on the longest edge, encode as base64 JPEG."""
    w, h = image.size
    if max(w, h) > max_side:
        scale = max_side / max(w, h)
        image = image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=92)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _call_roboflow(image: Image.Image) -> dict:
    """Send image to Roboflow Serverless API and return raw prediction dict."""
    api_key  = _get_api_key()
    b64_data = _encode_image(image)

    url = f"{ROBOFLOW_API_URL}/{ROBOFLOW_MODEL_ID}"
    headers = {
        "Authorization": f"Bearer {api_key}",   # key in header, NOT query string
        "Content-Type":  "application/x-www-form-urlencoded",
    }

    resp = requests.post(url, data=b64_data, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def _crop_region(
    image: Image.Image,
    pred: dict,
    orig_w: int,
    orig_h: int,
    model_w: int,
    model_h: int,
    padding: int = 6,
) -> Image.Image | None:
    """
    Crop the bounding box from the original image.
    Roboflow returns (x, y) as the bbox centre in model-space coordinates.
    We scale back to original image dimensions.
    """
    scale_x = orig_w / model_w
    scale_y = orig_h / model_h

    cx = pred["x"] * scale_x
    cy = pred["y"] * scale_y
    bw = pred["width"]  * scale_x
    bh = pred["height"] * scale_y

    x1 = max(0, int(cx - bw / 2) - padding)
    y1 = max(0, int(cy - bh / 2) - padding)
    x2 = min(orig_w, int(cx + bw / 2) + padding)
    y2 = min(orig_h, int(cy + bh / 2) + padding)

    if x2 <= x1 or y2 <= y1:
        return None
    return image.crop((x1, y1, x2, y2))


def _ocr_crop(crop: Image.Image, field: str) -> str:
    """Run EasyOCR on a single cropped region and return cleaned text."""
    reader = _get_ocr_reader()
    arr = np.array(crop.convert("RGB"))
    results = reader.readtext(arr, detail=1, paragraph=False)
    lines = [r[1] for r in results if r[2] > 0.15]
    text = " ".join(lines).strip()

    # Field-specific cleanup
    if field == "aadhaar_number":
        digits = re.sub(r"[^0-9]", "", text)
        if len(digits) == 12:
            return f"XXXX XXXX {digits[8:]}"   # mask first 8 digits for privacy
        m = re.search(r"\d{4}\s\d{4}\s\d{4}", text)
        if m:
            parts = m.group().replace(" ", "")
            return f"XXXX XXXX {parts[8:]}"
        return text

    if field == "dob":
        m = re.search(r"\d{2}[/\-.]\d{2}[/\-.]\d{4}", text)
        return m.group() if m else text

    if field == "gender":
        t = text.strip().lower()
        if "male" in t and "female" not in t:
            return "Male"
        if "female" in t:
            return "Female"
        return text

    if field == "pincode":
        m = re.search(r"\b\d{6}\b", text)
        return m.group() if m else text

    return text


def run_kyc_ocr(image: Image.Image) -> dict:
    """
    Full pipeline: Roboflow entity detection → per-region EasyOCR → structured fields.

    Returns:
    {
        "success": bool,
        "method": "roboflow+easyocr",
        "document_type": str,
        "extracted": { name, dob, gender, aadhaar_number, address, pincode },
        "detections": [ { class_id, field, confidence, bbox } ],
        "ocr_engine": str,
        "confidence_note": str,
    }
    """
    t0 = time.perf_counter()
    orig_w, orig_h = image.size

    # ── 1. Call Roboflow ───────────────────────────────────────────────────────
    try:
        rf_result = _call_roboflow(image)
    except Exception as e:
        return {
            "success":  False,
            "error":    f"Roboflow API error: {e}",
            "method":   "roboflow+easyocr",
            "extracted": {},
            "detections": [],
        }

    predictions  = rf_result.get("predictions", [])
    model_w      = rf_result.get("image", {}).get("width",  orig_w)
    model_h      = rf_result.get("image", {}).get("height", orig_h)

    print(f"[Roboflow] {len(predictions)} detection(s) in {time.perf_counter()-t0:.2f}s")

    # ── 2. Detect document type ────────────────────────────────────────────────
    # (Always Aadhaar for this model; kept extensible)
    doc_type = "Aadhaar Card"

    # ── 3. Per-field extraction ────────────────────────────────────────────────
    extracted: dict[str, str] = {}
    detection_log: list[dict] = []

    for pred in predictions:
        raw_class = pred.get("class", "")
        field = CLASS_MAP.get(raw_class) or CLASS_MAP.get(str(raw_class), f"region_{raw_class}")
        conf  = round(pred.get("confidence", 0.0), 3)

        detection_log.append({
            "class_id":  raw_class,
            "field":     field,
            "confidence": conf,
            "bbox": {
                "x": pred.get("x"), "y": pred.get("y"),
                "width": pred.get("width"), "height": pred.get("height"),
            },
        })

        # Skip non-text regions and low-confidence detections
        if field in ("photo",) or conf < 0.25:
            continue

        # Crop and OCR the detected region
        crop = _crop_region(image, pred, orig_w, orig_h, model_w, model_h)
        if crop is None:
            continue

        ocr_text = _ocr_crop(crop, field)
        if ocr_text and field not in extracted:   # take highest-confidence hit per field
            extracted[field] = ocr_text
            print(f"[Roboflow OCR] {field}: {ocr_text.encode('ascii', 'ignore').decode('ascii')} (conf={conf})")

    # ── 4. Fill any missing fields with whole-image EasyOCR fallback ──────────
    all_fields = ["name", "dob", "gender", "aadhaar_number", "address", "pincode"]
    missing = [f for f in all_fields if f not in extracted]

    if missing:
        print(f"[Roboflow] Falling back to full-image OCR for: {missing}")
        reader = _get_ocr_reader()
        arr = np.array(image.convert("RGB"))
        full_results = reader.readtext(arr, detail=1, paragraph=False)
        full_text = "\n".join(r[1] for r in full_results if r[2] > 0.2)

        # Regex fallback for each missing field
        def find(patterns: list[str], text: str) -> str:
            for p in patterns:
                m = re.search(p, text, re.IGNORECASE | re.MULTILINE)
                if m:
                    return m.group(1).strip()
            return ""

        if "name" not in extracted:
            v = find([r"(?:Name|naam)[:\s]+([A-Za-z][A-Za-z .]{3,50})",
                       r"^([A-Z][a-z]+(?: [A-Z][a-z]+){1,3})$"], full_text)
            if v:
                extracted["name"] = v

        if "dob" not in extracted:
            v = find([r"(?:DOB|Date of Birth|D\.O\.B)[:\s/.]*(\d{2}[/\-.]\d{2}[/\-.]\d{4})",
                       r"(\d{2}[/\-.]\d{2}[/\-.]\d{4})"], full_text)
            if v:
                extracted["dob"] = v

        if "gender" not in extracted:
            v = find([r"(?:Gender|Sex)[:\s]*(Male|Female|MALE|FEMALE)",
                       r"\b(Male|Female)\b"], full_text)
            if v:
                extracted["gender"] = v

        if "aadhaar_number" not in extracted:
            m = re.search(r"(\d{4}[\s\-]\d{4}[\s\-]\d{4})", full_text)
            if m:
                digits = re.sub(r"[^\d]", "", m.group(1))
                if len(digits) == 12:
                    extracted["aadhaar_number"] = f"XXXX XXXX {digits[8:]}"

        if "address" not in extracted:
            v = find([r"(?:Address|Addr|S/O|W/O|C/O)[:\s]+(.{10,120}?)(?=\n[A-Z]|\d{6}|\Z)",
                       r"(?:House|H\.?No|Plot|Flat|Sector|Ward|Village|Nagar|Colony)[.,\s]+(.{5,120}?)(?=\n|\d{6}|\Z)"],
                      full_text)
            if v:
                extracted["address"] = v

        if "pincode" not in extracted:
            m = re.search(r"(?<!\d)(\d{6})(?!\d)", full_text)
            if m:
                extracted["pincode"] = m.group(1)

    elapsed = round(time.perf_counter() - t0, 2)
    nothing  = not any(extracted.get(f) for f in all_fields)
    used_rf  = len([d for d in detection_log if d["field"] not in ("photo",)]) > 0

    method_str = (
        f"Roboflow aadhar-card-entity-detection/1 → EasyOCR (en+hi)"
        if used_rf else "EasyOCR full-image fallback"
    )

    return {
        "success":       True,
        "method":        "roboflow+easyocr",
        "ocr_engine":    method_str,
        "document_type": doc_type,
        "extracted": {
            "name":           extracted.get("name",           "Not detected"),
            "dob":            extracted.get("dob",            "Not detected"),
            "gender":         extracted.get("gender",         "Not detected"),
            "aadhaar_number": extracted.get("aadhaar_number", "Not detected"),
            "address":        extracted.get("address",        "Not detected"),
            "pincode":        extracted.get("pincode",        "Not detected"),
        },
        "detections":   detection_log,
        "elapsed_sec":  elapsed,
        "confidence_note": (
            f"Detected via {method_str} in {elapsed}s from {doc_type}. "
            + ("⚠️ Some fields not detected — try a clearer/higher-res scan. " if nothing else "")
            + "Aadhaar number masked (last 4 digits shown). "
            + "Verify all fields via official UIDAI portal before use."
        ),
    }
