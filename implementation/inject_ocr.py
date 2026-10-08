"""Inject /kyc/ocr endpoint into backend/main.py"""

OCR_ENDPOINT = '''
@api.post("/kyc/ocr", tags=["KYC"])
async def kyc_ocr(kyc_document: UploadFile = File(...)):
    """Extract name, DOB, Aadhaar number, gender and address from Aadhaar card image using EasyOCR."""
    import re
    import numpy as np

    try:
        contents = await kyc_document.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        from PIL import Image

        try:
            image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Cannot read image: {e}")

        # Run EasyOCR (cached after first call)
        try:
            import easyocr
            reader = easyocr.Reader(["en", "hi"], gpu=False, verbose=False)
            import numpy as _np
            img_array = _np.array(image)
            raw_results = reader.readtext(img_array, detail=0, paragraph=True)
            lines = [str(t).strip() for t in raw_results if str(t).strip()]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OCR error: {e}")

        full_text = "\\n".join(lines)

        # Parse name: first non-boilerplate, letter-only line
        skip_pat = re.compile(
            r"(government|india|aadhaar|unique|identification|authority|uidai"
            r"|republic|bharat|aadhar|download)",
            re.IGNORECASE,
        )
        name = ""
        for line in lines:
            s = line.strip()
            if (
                len(s) >= 3
                and not skip_pat.search(s)
                and not re.search(r"\\d{4}", s)
                and re.search(r"[A-Za-z]", s)
                and not re.search(r"[:|\\\\/]", s)
            ):
                name = s.title()
                break

        # DOB: DD/MM/YYYY
        dob_m = re.search(r"\\b(\\d{2}[/\\-]\\d{2}[/\\-]\\d{4})\\b", full_text)
        dob = dob_m.group(1).replace("-", "/") if dob_m else ""

        # Aadhaar number (12-digit, may be masked)
        aadh_m = re.search(r"\\b(\\d{4}\\s\\d{4}\\s\\d{4}|\\d{12}|[Xx]{4}\\s[Xx]{4}\\s\\d{4})\\b", full_text)
        aadhaar_num = aadh_m.group(1) if aadh_m else ""

        # Gender
        gender = ""
        if re.search(r"\\bMALE\\b", full_text, re.IGNORECASE):
            gender = "Male"
        elif re.search(r"\\bFEMALE\\b", full_text, re.IGNORECASE):
            gender = "Female"

        # Address block
        address = ""
        addr_m = re.search(r"(?:Address|Addr|पता)[:\\s]+(.+?)(?:\\n\\d|\\Z)", full_text, re.IGNORECASE | re.DOTALL)
        if addr_m:
            address = " ".join(addr_m.group(1).split())[:200]

        # Pincode
        pin_m = re.search(r"\\b([1-9]\\d{5})\\b", full_text)
        pincode = pin_m.group(1) if pin_m else ""

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

'''

with open("backend/main.py", encoding="utf-8") as f:
    content = f.read()

# Inject right after the /kyc/analyze endpoint's closing except block
insertion_marker = '@api.post("/voice/analyze"'
if insertion_marker not in content:
    print("ERROR: marker not found")
else:
    idx = content.index(insertion_marker)
    content = content[:idx] + OCR_ENDPOINT + content[idx:]
    with open("backend/main.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS: /kyc/ocr endpoint injected")
