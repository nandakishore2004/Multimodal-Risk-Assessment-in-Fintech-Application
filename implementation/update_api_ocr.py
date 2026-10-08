"""Add kycOcr method to api.ts and KycOcrResponse interface"""
content = open("frontend/src/lib/api.ts", encoding="utf-8").read()

# Add KycOcrResponse interface before the api functions section
ocr_iface = """export interface KycOcrResponse {
  success: boolean;
  extracted: {
    name: string;
    dob: string;
    gender: string;
    aadhaar_number: string;
    address: string;
    pincode: string;
  };
  raw_text: string;
  confidence_note: string;
}

"""
content = content.replace("// ─── API Functions", ocr_iface + "// ─── API Functions")

# Add kycOcr method right after analyzeKyc
ocr_method = """
  kycOcr: async (file: File) => {
    const fd = new FormData();
    fd.append("kyc_document", file);
    const res = await fetch(`${API_BASE}/kyc/ocr`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail ?? data?.error ?? "KYC OCR failed");
    return data as KycOcrResponse;
  },

"""
content = content.replace(
    "  analyzeVoice:",
    ocr_method + "  analyzeVoice:"
)

open("frontend/src/lib/api.ts", "w", encoding="utf-8").write(content)
print("SUCCESS: KycOcrResponse + kycOcr method added to api.ts")
