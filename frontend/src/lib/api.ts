/**
 * NeoRisk API Client
 * Typed fetch wrappers — all calls go through Next.js proxy → Flask :5000
 */

// Empty base = use Next.js proxy rewrites (next.config.ts → localhost:5000)
const API_BASE = "";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers:
      init?.body instanceof FormData
        ? { ...init?.headers }
        : { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail ?? data?.error ?? "API error");
  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  name: string;
  email: string;
  credit_score: number;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  notice: string;
}

export interface ModelStatus {
  vit: boolean;
  deberta: boolean;
  ft_transformer: boolean;
  whisper: boolean;
  fusion: boolean;
}

export interface HealthResponse {
  status: string;
  models: ModelStatus;
  device: string;
}

export interface Wallet {
  user_name: string;
  account_no: string;
  bank_name: string;
  upi_id: string;
  balance: number;
}

export interface ModalityResult {
  status: string;
  fraud_prob: number;
  prediction: string;
}

export interface AssessmentResult {
  success: boolean;
  overall_risk: number;
  verdict: string;
  color: string;
  risk_factors: string[];
  results: {
    image?: ModalityResult;
    voice?: ModalityResult;
    text?: ModalityResult;
    transaction?: ModalityResult;
  };
}

export interface LoanOffer {
  bank: string;
  product: string;
  interest_rate: number;
  approved_amount: number;
  estimated_emi: number;
  tenure_months: number;
  why_recommended: string;
}

export interface BankRule {
  bank: string;
  rules: string[];
  eligible: boolean;
  reasons: string[];
}

export interface LoanResponse {
  success: boolean;
  application_id: string;
  applicant_name: string;
  decision: string;
  decision_code: "approved" | "review" | "declined";
  eligibility_score: number;
  overall_risk: number;
  financial_summary: {
    credit_score: number;
    monthly_income: number;
    proposed_emi: number;
    debt_to_income_percent: number;
    loan_income_ratio: number;
    financial_risk: number;
    repayment_sequence_risk: number;
    reference_network_risk: number;
  };
  multimodal_assessment: AssessmentResult;
  factors: string[];
  bank_recommendations: LoanOffer[];
  bank_rules: BankRule[];
  disclaimer: string;
}

export interface PaymentResponse {
  success: boolean;
  status: "APPROVED" | "BLOCKED" | "FLAGGED" | "INSUFFICIENT_FUNDS" | "PENDING_TELEGRAM";
  tx_id: string;
  amount: number;
  recipient_name: string;
  recipient_id: string;
  overall_risk: number;
  title: string;
  message: string;
  new_balance?: number;
  risk_factors: string[];
}

export interface KycResponse {
  success: boolean;
  fraud_prob: number;
  prediction: string;
  model_used: string;
  guidance: string;
}

export interface VoiceResponse {
  success: boolean;
  final_transcript: string;
  fraud_prob: number;
  prediction: string;
  matched_keywords: string[];
  model_used: string;
}

export interface KycOcrResponse {
  success: boolean;
  ocr_engine?: string;
  document_type?: string;
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
  detections?: {
    class_id: string;
    field: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const api = {
  // Health check
  health: () => apiFetch<HealthResponse>("/api/health"),

  // Auth
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Wallet
  getWallet: () => apiFetch<{ success: boolean; wallet: Wallet }>("/api/wallet"),

  // Model info
  getModelInfo: () => apiFetch<Record<string, unknown>>("/api/model_info"),

  // Loan
  loanAssess: (payload: Record<string, unknown>) =>
    apiFetch<LoanResponse>("/api/loan_assess", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Payment
  pay: (payload: Record<string, unknown>) =>
    apiFetch<PaymentResponse>("/api/pay", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Risk assessment
  assessRisk: (payload: Record<string, unknown>) =>
    apiFetch<AssessmentResult>("/api/assess_risk", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // KYC document tampering analysis (ViT model)
  analyzeKyc: async (file: File) => {
    const fd = new FormData();
    fd.append("kyc_document", file);
    const res = await fetch("http://localhost:5000/api/kyc_analyze", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail ?? data?.error ?? "KYC analysis failed");
    return data as KycResponse;
  },

  // KYC OCR – extract text fields from document image
  kycOcr: async (file: File) => {
    const fd = new FormData();
    fd.append("kyc_document", file);
    const res = await fetch("http://localhost:5000/api/kyc_ocr", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail ?? data?.error ?? "KYC OCR failed");
    return data as KycOcrResponse;
  },

  // Voice analysis — transcript-only (browser Speech API already transcribed it);
  // we never upload the raw audio blob to avoid the 10-30s Whisper wait.
  analyzeVoice: async (_audio: Blob | null | undefined, transcript = "", language = "") => {
    const fd = new FormData();
    // Send text transcript only — backend does instant NLP keyword analysis
    if (transcript) fd.append("transcript", transcript);
    if (language)   fd.append("language",   language);
    // Note: audio blob intentionally NOT uploaded (local playback only)
    const res  = await fetch("http://localhost:5000/api/voice_analyze", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail ?? data?.error ?? "Voice analysis failed");
    return data as VoiceResponse;
  },

  // Poll Telegram payment status
  payStatus: (tx_id: string) =>
    fetch(`/api/pay/status/${tx_id}?t=${Date.now()}`).then((r) => r.json()),
};

// ─── Auth helpers (localStorage) ─────────────────────────────────────────────

export const auth = {
  save: (user: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("finpay_user", JSON.stringify(user));
      localStorage.setItem("neorisk_user", JSON.stringify(user));
    }
  },

  load: (): User | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("finpay_user") || localStorage.getItem("neorisk_user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("finpay_user");
      localStorage.removeItem("neorisk_user");
    }
  },
};
