"use client";
import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, TrendingUp, CheckCircle, AlertTriangle, XCircle,
  Loader2, Building2, Percent, Clock, Lock,
  Shield, Mic, Square, Upload, Volume2,
  BadgeCheck, Eye, ChevronRight, RefreshCw,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import RiskMeter from "@/components/RiskMeter";
import { api, auth, type LoanResponse, type BankRule, type KycResponse, type VoiceResponse } from "@/lib/api";

const TENURES = [12, 24, 36, 48, 60];

// ── Step definitions ──────────────────────────────────────────────────────────
type Step = 0 | 1 | 2 | 3;
const STEP_META: { icon: string; label: string; sub: string }[] = [
  { icon: "🪪", label: "KYC Verification",  sub: "ViT-B/16 document check" },
  { icon: "📋", label: "Loan Details",      sub: "Financial information" },
  { icon: "🎙️", label: "Voice Declaration", sub: "Whisper AI + NLP analysis" },
  { icon: "🏦", label: "Combined Score",    sub: "Final AI risk assessment" },
];

// ── Score bar component ───────────────────────────────────────────────────────
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 800, color }}>{value}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 99, background: color }}
        />
      </div>
    </div>
  );
}

// ── Step progress indicator ───────────────────────────────────────────────────
function StepProgress({ current, kycDone, formDone, voiceDone }: { current: Step; kycDone: boolean; formDone: boolean; voiceDone: boolean }) {
  const statuses = [
    kycDone ? "done" : current === 0 ? "active" : "locked",
    formDone ? "done" : current === 1 ? "active" : current > 1 ? "done" : "locked",
    voiceDone ? "done" : current === 2 ? "active" : current > 2 ? "done" : "locked",
    current === 3 ? "active" : "locked",
  ];
  return (
    <div className="glass-card" style={{ padding: "18px 24px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {STEP_META.map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: statuses[i] === "done" ? 14 : 13,
                fontWeight: 800, transition: "all 0.3s",
                background: statuses[i] === "done" ? "var(--success)"
                  : statuses[i] === "active" ? "var(--accent)"
                  : "var(--bg-secondary)",
                color: statuses[i] === "locked" ? "var(--text-muted)" : "#fff",
                border: statuses[i] === "active" ? "2px solid var(--accent)" : "2px solid transparent",
                boxShadow: statuses[i] === "active" ? "0 0 14px var(--accent-glow)" : "none",
              }}>
                {statuses[i] === "done" ? <CheckCircle size={17} /> : statuses[i] === "locked" ? <Lock size={14} /> : i + 1}
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: statuses[i] === "active" ? 700 : 500, color: statuses[i] === "active" ? "var(--accent)" : statuses[i] === "done" ? "var(--success)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {s.icon} {s.label}
                </p>
                <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.sub}</p>
              </div>
            </div>
            {i < STEP_META.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: "0 6px", marginBottom: 32, background: statuses[i] === "done" ? "var(--success)" : "var(--border-color)", transition: "background 0.4s" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function LoanPage() {
  const user = auth.load();
  const [step, setStep] = useState<Step>(0);

  // ── Step 0: KYC ───────────────────────────────────────────────────────────
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycPreview, setKycPreview] = useState<string | null>(null);
  const [kycResult, setKycResult] = useState<KycResponse | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState("");
  const [kycDrag, setKycDrag] = useState(false);

  const handleKycFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setKycError("Only image files (JPG, PNG, WEBP) supported."); return; }
    setKycFile(f); setKycResult(null); setKycError("");
    const reader = new FileReader();
    reader.onload = e => setKycPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const analyzeKyc = async () => {
    if (!kycFile) return;
    setKycLoading(true); setKycError("");
    try {
      const kRes = await api.analyzeKyc(kycFile);
      setKycResult(kRes);
    }
    catch (e) { setKycError(e instanceof Error ? e.message : "KYC analysis failed"); }
    finally { setKycLoading(false); }
  };

  // ── Step 1: Loan form ─────────────────────────────────────────────────────
  const [form, setForm] = useState({
    applicant_name: user?.name ?? "",
    dob: "",
    gender: "",
    aadhaar_number: "",
    address: "",
    pincode: "",
    monthly_income: "",
    monthly_obligations: "0",
    credit_score: String(user?.credit_score ?? "750"),
    loan_amount: "",
    tenure_months: "36",
    employment_years: "",
    missed_emis: "0",
    reference_risk: "10",
    purpose: "",
  });
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── Live DTI calculator ───────────────────────────────────────────────────
  const liveCalc = useMemo(() => {
    const income = parseFloat(form.monthly_income) || 0;
    const oblig  = parseFloat(form.monthly_obligations) || 0;
    const amount = parseFloat(form.loan_amount) || 0;
    const tenure = parseInt(form.tenure_months) || 36;
    const score  = parseInt(form.credit_score) || 750;

    if (income <= 0) return null;

    const rate = score >= 750 ? 10.5 : score >= 650 ? 12.5 : 15.5;
    const mr   = rate / 1200;
    const emi  = amount > 0
      ? (mr === 0 ? amount / tenure : amount * mr * Math.pow(1+mr, tenure) / (Math.pow(1+mr, tenure) - 1))
      : 0;
    const dti  = (oblig + emi) / income;

    // Max amount at 40% DTI (safe) and 50% DTI (limit)
    const maxEmiSafe  = income * 0.40 - oblig;
    const maxEmiLimit = income * 0.50 - oblig;
    const calcMax = (maxEmi: number) => {
      if (maxEmi <= 0) return 0;
      if (mr === 0) return maxEmi * tenure;
      return Math.floor(maxEmi * (Math.pow(1+mr, tenure) - 1) / (mr * Math.pow(1+mr, tenure)));
    };
    const maxSafe  = calcMax(maxEmiSafe);
    const maxLimit = calcMax(maxEmiLimit);

    return { income, oblig, amount, emi, dti, maxSafe, maxLimit, rate };
  }, [form.monthly_income, form.monthly_obligations, form.loan_amount, form.tenure_months, form.credit_score]);

  // Demo auto-fill with bank-eligible values
  const autofillDemo = () => {
    setForm(f => ({
      ...f,
      applicant_name: user?.name ?? "SVN Kishore",
      dob: "20/04/2004",
      gender: "Male",
      aadhaar_number: "1234 5678 9012",
      address: "Hyderabad, Telangana",
      pincode: "500081",
      monthly_income: "60000",
      monthly_obligations: "5000",
      credit_score: String(user?.credit_score ?? "820"),
      loan_amount: "500000",
      tenure_months: "36",
      employment_years: "3",
      missed_emis: "0",
      reference_risk: "10",
      purpose: "Home renovation",
    }));
  };

  const step1Valid = !!(
    form.applicant_name.trim() && 
    form.monthly_income && 
    form.credit_score && 
    form.loan_amount && 
    form.employment_years
  );

  // ── Step 2: Voice ─────────────────────────────────────────────────────────
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceResult, setVoiceResult] = useState<VoiceResponse | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [recState, setRecState] = useState<"idle" | "recording" | "recorded">("idle");
  const [voiceLang, setVoiceLang] = useState<"te" | "en">("te");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(async () => {
    setVoiceError(""); setVoiceResult(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = voiceLang === "te" ? "te-IN" : "en-IN";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (ev: any) => {
          let t = ""; for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript + " ";
          if (t.trim()) setVoiceTranscript(t.trim());
        };
        rec.start(); recognitionRef.current = rec;
      }
    } catch { /* ignore */ }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop()); setRecState("recorded");
      };
      mr.start(200); mediaRef.current = mr; setRecState("recording");
    } catch {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      setVoiceError("Microphone access denied. Please type your declaration below.");
    }
  }, [voiceLang]);

  const stopRecording = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    if (mediaRef.current?.state === "recording") mediaRef.current.stop();
    else setRecState("recorded");
  }, []);

  const analyzeVoice = async () => {
    if (!voiceTranscript.trim()) {
      setVoiceError("Please record or type your voice declaration first.");
      return;
    }
    setVoiceLoading(true); setVoiceError("");

    // ── Step 1: Instant client-side NLP (< 5ms) ──────────────────────────────
    const suspiciousWords = ["urgent","password","otp","block","unblock","hacked","stolen","money","transfer","account"];
    const tl = voiceTranscript.toLowerCase();
    const matched = suspiciousWords.filter(w => tl.includes(w));
    const isSuspicious = matched.length > 0;
    const instantResult: VoiceResponse = {
      success: true,
      final_transcript: voiceTranscript,
      fraud_prob: isSuspicious ? Math.min(0.95, 0.55 + matched.length * 0.10) : 0.08,
      prediction: isSuspicious ? "High-Risk Speech Pattern" : "Normal Speech",
      matched_keywords: matched,
      model_used: "NLP (instant)",
    };
    setVoiceResult(instantResult); // Show immediately!
    setVoiceLoading(false);

    // ── Step 2: Backend confirmation in background (updates if different) ─────
    try {
      const res = await api.analyzeVoice(null, voiceTranscript, voiceLang);
      setVoiceResult(res); // Silently update with backend result
    } catch {
      // Backend failed — keep instant result, no error shown
    }
  };

  // ── Step 3: Final loan assessment ─────────────────────────────────────────
  const [result, setResult] = useState<LoanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const res = await api.loanAssess({
        applicant_name: form.applicant_name,
        monthly_income: parseFloat(form.monthly_income),
        monthly_obligations: parseFloat(form.monthly_obligations),
        credit_score: parseInt(form.credit_score),
        loan_amount: parseFloat(form.loan_amount),
        tenure_months: parseInt(form.tenure_months),
        employment_years: parseFloat(form.employment_years),
        missed_emis: parseInt(form.missed_emis),
        reference_risk: parseFloat(form.reference_risk),
        purpose: form.purpose,
        voice_transcript: voiceTranscript,
        has_kyc: true,
        kyc_fraud_prob: kycResult!.fraud_prob,
      } as Record<string, unknown>);
      setResult(res);
    } catch (e) { setError(e instanceof Error ? e.message : "Assessment failed"); }
    finally { setLoading(false); }
  };

  const resetAll = () => {
    setStep(0); setResult(null);
    setKycFile(null); setKycPreview(null); setKycResult(null); setKycError("");
    setVoiceTranscript(""); setVoiceResult(null); setAudioBlob(null); setAudioUrl(null); setRecState("idle");
    setError("");
  };

  const DECISION_CONFIG = {
    approved: { color: "var(--success)", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", icon: CheckCircle, label: "PRE-APPROVED 🎉" },
    review:   { color: "var(--warning)", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: AlertTriangle, label: "MANUAL REVIEW 🔍" },
    declined: { color: "var(--danger)",  bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)",  icon: XCircle,      label: "NOT RECOMMENDED ✗" },
  };

  // ── Combined score calculation (frontend preview) ─────────────────────────
  const getCombinedRisk = () => {
    if (!result) return null;
    const fin = result.overall_risk;
    const kyc = kycResult ? Math.round(kycResult.fraud_prob * 100) : 0;
    const voc = voiceResult ? Math.round(voiceResult.fraud_prob * 100) : 0;
    return { financial: fin, kyc, voice: voc, combined: Math.round(fin * 0.5 + kyc * 0.3 + voc * 0.2) };
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="page-wrapper">
      <div className="gradient-mesh" />
      <NavBar />
      <main className="main-content" style={{ position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <h1 className="section-title">Loan Application</h1>
          <p className="section-sub">
            Complete all 3 verifications to get your combined AI risk score &amp; bank offers
          </p>
        </motion.div>

        {/* Step progress */}
        <StepProgress current={step} kycDone={!!kycResult} formDone={step1Valid} voiceDone={!!voiceResult} />

        <AnimatePresence mode="wait">

          {/* ══════════ STEP 0: KYC ══════════ */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="glass-card" style={{ padding: 30, maxWidth: 680, margin: "0 auto" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  🪪 Step 1: KYC Document Verification
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
                  Upload your Aadhaar card. <strong>ViT-B/16</strong> will verify document authenticity.
                  <br />
                  <span style={{ color: "var(--danger)", fontWeight: 600 }}>⚠ Mandatory — must verify before proceeding.</span>
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setKycDrag(true); }}
                  onDragLeave={() => setKycDrag(false)}
                  onDrop={e => { e.preventDefault(); setKycDrag(false); const f = e.dataTransfer.files[0]; if (f) handleKycFile(f); }}
                  onClick={() => document.getElementById("kyc-file-s0")?.click()}
                  style={{ padding: 28, textAlign: "center", borderRadius: 14, border: `2px dashed ${kycDrag ? "var(--accent)" : "var(--border-color)"}`, background: kycDrag ? "var(--accent-glow)" : "var(--bg-secondary)", cursor: "pointer", transition: "all 0.2s", marginBottom: 16 }}
                >
                  <input id="kyc-file-s0" type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleKycFile(e.target.files[0])} />
                  {kycPreview ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={kycPreview} alt="KYC preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10, objectFit: "contain", border: "1px solid var(--border-color)", marginBottom: 10 }} />
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>📄 {kycFile?.name} · click to replace</p>
                    </div>
                  ) : (
                    <div style={{ padding: "16px 0" }}>
                      <Upload size={40} style={{ margin: "0 auto 12px", color: "var(--accent)", opacity: 0.7 }} />
                      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Drag &amp; drop or click to upload</p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Aadhaar Card (Front) — JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>

                {kycFile && !kycResult && (
                  <button type="button" id="kyc-analyze-s0" className="btn-primary" onClick={analyzeKyc} disabled={kycLoading}
                    style={{ width: "100%", height: 44, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {kycLoading ? <><Loader2 size={15} className="spin-slow" /> Verifying Document…</> : <><Eye size={15} /> Verify KYC Document</>}
                  </button>
                )}

                {kycError && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>
                    <XCircle size={14} style={{ display: "inline", marginRight: 6 }} />{kycError}
                  </div>
                )}

                {/* KYC Result */}
                {kycResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: "16px 18px", borderRadius: 12, marginBottom: 20, background: kycResult.fraud_prob <= 0.5 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${kycResult.fraud_prob <= 0.5 ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      {kycResult.fraud_prob <= 0.5
                        ? <BadgeCheck size={32} color="var(--success)" />
                        : <AlertTriangle size={32} color="var(--danger)" />}
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 15, color: kycResult.fraud_prob <= 0.5 ? "var(--success)" : "var(--danger)" }}>
                          {kycResult.prediction}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          Model: {kycResult.model_used}
                        </p>
                      </div>
                    </div>
                    <ScoreBar
                      label="KYC Fraud Risk"
                      value={Math.round(kycResult.fraud_prob * 100)}
                      color={kycResult.fraud_prob <= 0.5 ? "var(--success)" : "var(--danger)"}
                    />
                    {kycResult.guidance && (
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 8 }}>{kycResult.guidance}</p>
                    )}

                  </motion.div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" className="btn-primary" onClick={() => setStep(1)} disabled={!kycResult}
                    style={{ width: "100%", height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: kycResult ? 1 : 0.5 }} id="kyc-next-form">
                    {kycResult
                      ? <><Shield size={16} /> KYC Verified — Continue to Loan Details <ChevronRight size={16} /></>
                      : <><Lock size={15} /> Verify KYC to Continue</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════ STEP 1: Loan Details (Auto-filled) ══════════ */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="glass-card" style={{ padding: 30, maxWidth: 740, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    📋 Step 2: Loan Application Details
                  </h2>
                  <button type="button" onClick={autofillDemo}
                    style={{ fontSize: 12, fontWeight: 700, padding: "7px 16px", borderRadius: 8, border: "1.5px solid var(--accent)", background: "transparent", color: "var(--accent)", cursor: "pointer", whiteSpace: "nowrap" }}>
                    ⚡ Auto-fill Demo
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                    <div>
                      <label className="input-label">Full Name</label>
                      <input className="input-field" value={form.applicant_name} onChange={e => setF("applicant_name", e.target.value)} required placeholder="Rahul Sharma" />
                    </div>
                    <div>
                      <label className="input-label">Aadhaar Number</label>
                      <input className="input-field" value={form.aadhaar_number} onChange={e => setF("aadhaar_number", e.target.value)} placeholder="XXXX XXXX 1234" />
                    </div>
                    <div>
                      <label className="input-label">Date of Birth</label>
                      <input className="input-field" value={form.dob} onChange={e => setF("dob", e.target.value)} placeholder="DD/MM/YYYY" />
                    </div>
                    <div>
                      <label className="input-label">Gender</label>
                      <input className="input-field" value={form.gender} onChange={e => setF("gender", e.target.value)} placeholder="Male / Female" />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className="input-label">Address</label>
                      <input className="input-field" value={form.address} onChange={e => setF("address", e.target.value)} placeholder="Address from Aadhaar" />
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label className="input-label">Monthly Income (₹)</label>
                    <input className="input-field" type="number" value={form.monthly_income} onChange={e => setF("monthly_income", e.target.value)} required min="1" placeholder="50000" />
                  </div>
                  <div>
                    <label className="input-label">Monthly Obligations (₹)</label>
                    <input className="input-field" type="number" value={form.monthly_obligations} onChange={e => setF("monthly_obligations", e.target.value)} min="0" placeholder="5000" />
                  </div>
                  <div>
                    <label className="input-label">Credit Score (300–900)</label>
                    <input className="input-field" type="number" value={form.credit_score} onChange={e => setF("credit_score", e.target.value)} required min="300" max="900" />
                  </div>
                  <div>
                    <label className="input-label">Employment (years)</label>
                    <input className="input-field" type="number" value={form.employment_years} onChange={e => setF("employment_years", e.target.value)} required min="0" step="0.5" placeholder="3" />
                  </div>
                  <div>
                    <label className="input-label">Loan Amount (₹)</label>
                    <input className="input-field" type="number" value={form.loan_amount} onChange={e => setF("loan_amount", e.target.value)} required min="1" placeholder="500000" />
                  </div>
                  <div>
                    <label className="input-label">Missed EMIs (last 12 months)</label>
                    <input className="input-field" type="number" value={form.missed_emis} onChange={e => setF("missed_emis", e.target.value)} min="0" max="12" />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="input-label">Tenure</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {TENURES.map(t => (
                        <button key={t} type="button" onClick={() => setF("tenure_months", String(t))}
                          style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", background: form.tenure_months === String(t) ? "var(--accent)" : "var(--bg-secondary)", color: form.tenure_months === String(t) ? "#fff" : "var(--text-secondary)", borderColor: form.tenure_months === String(t) ? "var(--accent)" : "var(--border-color)" }}>
                          {t}M
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* ── Live DTI Panel ── */}
                  {liveCalc && (
                    <div style={{ gridColumn: "1 / -1", borderRadius: 12, padding: "14px 18px",
                      background: liveCalc.dti > 0.67 ? "rgba(239,68,68,0.10)" : liveCalc.dti > 0.50 ? "rgba(251,191,36,0.10)" : "rgba(15,188,176,0.10)",
                      border: `1.5px solid ${liveCalc.dti > 0.67 ? "#ef4444" : liveCalc.dti > 0.50 ? "#fbbf24" : "var(--accent)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>📊 Live DTI (Debt-to-Income)</div>
                          <div style={{ fontSize: 24, fontWeight: 900,
                            color: liveCalc.dti > 0.67 ? "#ef4444" : liveCalc.dti > 0.50 ? "#fbbf24" : "var(--accent)" }}>
                            {(liveCalc.dti * 100).toFixed(1)}%
                            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginLeft: 8 }}>
                              {liveCalc.dti > 0.67 ? "🔴 Too High — All banks decline"
                               : liveCalc.dti > 0.50 ? "🟡 High — Most banks decline"
                               : liveCalc.dti > 0.40 ? "🟡 Moderate — Some banks approve"
                               : "🟢 Healthy — Most banks approve"}
                            </span>
                          </div>
                          {liveCalc.emi > 0 && (
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                              Monthly EMI: <strong style={{ color: "var(--text-primary)" }}>₹{Math.round(liveCalc.emi).toLocaleString()}</strong>
                              &nbsp;+&nbsp;Obligations: <strong style={{ color: "var(--text-primary)" }}>₹{liveCalc.oblig.toLocaleString()}</strong>
                              &nbsp;= <strong style={{ color: "var(--text-primary)" }}>₹{Math.round(liveCalc.emi + liveCalc.oblig).toLocaleString()}</strong> / ₹{liveCalc.income.toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Max Eligible Amount</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--success)" }}>
                            ₹{liveCalc.maxSafe > 0 ? Math.round(liveCalc.maxSafe).toLocaleString() : "—"}
                            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}> (safe 40%)</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>
                            ₹{liveCalc.maxLimit > 0 ? Math.round(liveCalc.maxLimit).toLocaleString() : "—"}
                            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}> (max 50%)</span>
                          </div>
                          {liveCalc.maxLimit > 0 && (
                            <button type="button"
                              onClick={() => setF("loan_amount", String(Math.round(liveCalc.maxSafe)))}
                              style={{ marginTop: 6, fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", cursor: "pointer", fontWeight: 700 }}>
                              Use Safe Amount
                            </button>
                          )}
                        </div>
                      </div>
                      {/* DTI bar */}
                      <div style={{ marginTop: 10, height: 6, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 99, width: `${Math.min(100, liveCalc.dti * 100)}%`,
                          background: liveCalc.dti > 0.67 ? "#ef4444" : liveCalc.dti > 0.50 ? "#fbbf24" : "var(--accent)",
                          transition: "width 0.4s ease, background 0.3s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                        <span>0%</span><span style={{ color: "var(--accent)", fontWeight: 700 }}>40% Safe</span><span style={{ color: "#fbbf24", fontWeight: 700 }}>50% Limit</span><span>100%</span>
                      </div>
                    </div>
                  )}

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="input-label">Loan Purpose</label>
                    <input className="input-field" value={form.purpose} onChange={e => setF("purpose", e.target.value)} placeholder="Home renovation, medical, education…" />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="input-label">Reference Network Risk (0–100)</label>
                    <input className="input-field" type="range" min="0" max="100" value={form.reference_risk} onChange={e => setF("reference_risk", e.target.value)} style={{ accentColor: "var(--accent)" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      <span>Low Risk (0)</span>
                      <span style={{ fontWeight: 600 }}>{form.reference_risk}</span>
                      <span>High Risk (100)</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button type="button" className="btn-ghost" onClick={() => setStep(0)} style={{ flex: 1, height: 48 }}>← Back</button>
                  <button type="button" className="btn-primary" onClick={() => setStep(2)} disabled={!step1Valid}
                    style={{ flex: 2, height: 48, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} id="loan-next-voice">
                    Next: Voice Declaration <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════ STEP 2: Voice ══════════ */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="glass-card" style={{ padding: 30, maxWidth: 680, margin: "0 auto" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  🎙️ Step 3: Voice Declaration
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
                  Record your loan declaration in Telugu or English. <strong>Whisper AI</strong> transcribes and NLP detects fraud intent.
                  <br />
                  <span style={{ color: "var(--danger)", fontWeight: 600 }}>⚠ Mandatory — must analyze before submitting.</span>
                </p>

                {/* Language Toggle */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                  <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: 12, padding: 4, border: "1px solid var(--border-color)" }}>
                    <button type="button" onClick={() => setVoiceLang("te")} disabled={recState === "recording"}
                      style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", border: "none", background: voiceLang === "te" ? "var(--accent)" : "transparent", color: voiceLang === "te" ? "#fff" : "var(--text-secondary)" }}>
                      తెలుగు (Telugu)
                    </button>
                    <button type="button" onClick={() => setVoiceLang("en")} disabled={recState === "recording"}
                      style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", border: "none", background: voiceLang === "en" ? "var(--accent)" : "transparent", color: voiceLang === "en" ? "#fff" : "var(--text-secondary)" }}>
                      English
                    </button>
                  </div>
                </div>

                {/* Big mic button */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ position: "relative", display: "inline-flex", marginBottom: 14 }}>
                    {recState === "recording" && (
                      <>
                        <span style={{ position: "absolute", inset: -14, borderRadius: "50%", border: "2px solid var(--danger)", opacity: 0.6, animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite" }} />
                        <span style={{ position: "absolute", inset: -26, borderRadius: "50%", border: "1px dashed var(--danger)", opacity: 0.25, animation: "spin 6s linear infinite" }} />
                      </>
                    )}
                    <button type="button" id="voice-mic-s2"
                      onClick={recState === "recording" ? stopRecording : startRecording}
                      style={{ width: 88, height: 88, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: recState === "recording" ? "linear-gradient(135deg,#ef4444,#b91c1c)" : "linear-gradient(135deg,var(--accent),var(--accent-cyan))", boxShadow: recState === "recording" ? "0 0 32px rgba(239,68,68,0.55)" : "0 0 28px var(--accent-glow)", transition: "all 0.3s" }}>
                      {recState === "recording" ? <Square size={30} color="#fff" /> : <Mic size={32} color="#fff" />}
                    </button>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                    {recState === "idle" ? "Click the Microphone to Speak" : recState === "recording" ? "🔴 Recording… speak now!" : "✅ Recording complete"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {recState === "recording" ? (voiceLang === "te" ? "మీ మాటలు కింద బాక్స్‌లో వస్తాయి" : "Your words appear in the transcript box below") : (voiceLang === "te" ? "తెలుగు కోసం ఆన్ చేయండి" : "English speech selected")}
                  </p>
                  {recState === "recording" && (
                    <button type="button" id="voice-stop-s2" onClick={stopRecording}
                      style={{ marginTop: 12, padding: "10px 32px", borderRadius: 10, border: "2px solid rgba(239,68,68,0.6)", background: "rgba(239,68,68,0.1)", color: "var(--danger)", fontWeight: 800, fontSize: 14, cursor: "pointer", animation: "pulse-red 1.5s ease-in-out infinite" }}>
                      ⏹ Mic ఆపు (Stop Recording)
                    </button>
                  )}
                </div>

                {/* Equalizer bars during recording */}
                {recState === "recording" && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5, height: 36, marginBottom: 16 }}>
                    {[35, 70, 100, 50, 85, 60, 95, 45, 75, 55, 90].map((h, i) => (
                      <span key={i} style={{ width: 4, height: `${h}%`, borderRadius: 99, background: "var(--danger)", animation: `wave 0.8s ease-in-out infinite alternate ${i * 0.08}s` }} />
                    ))}
                  </div>
                )}

                {audioUrl && (
                  <div style={{ padding: "10px 16px", borderRadius: 10, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                      <Volume2 size={13} color="var(--accent)" /> Recorded Audio
                    </div>
                    <audio controls src={audioUrl} style={{ width: "100%", height: 36 }} />
                  </div>
                )}

                <label className="input-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Speech Transcript
                  {recState === "recording" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(239,68,68,0.15)", color: "var(--danger)" }}>LIVE</span>}
                </label>
                <textarea id="voice-transcript-s2" className="input-field" value={voiceTranscript} onChange={e => setVoiceTranscript(e.target.value)}
                  rows={4} placeholder={voiceLang === "te" ? "మీరు మాట్లాడిన మాటలు ఇక్కడ కనిపిస్తాయి… లేక ఇక్కడ టైప్ చేయండి…" : "Your words will appear here... or type your declaration..."}
                  style={{ resize: "vertical", lineHeight: 1.6, marginBottom: 14, borderColor: recState === "recording" ? "var(--accent)" : undefined }} />

                {(voiceTranscript.trim() || audioBlob) && !voiceResult && (
                  <button type="button" id="voice-analyze-s2" className="btn-primary" onClick={analyzeVoice} disabled={voiceLoading}
                    style={{ width: "100%", height: 44, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {voiceLoading ? <><Loader2 size={15} className="spin-slow" /> Analyzing with Whisper AI…</> : <><Mic size={15} /> Analyze Voice Declaration</>}
                  </button>
                )}

                {voiceError && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>
                    <XCircle size={14} style={{ display: "inline", marginRight: 6 }} />{voiceError}
                  </div>
                )}

                {/* Voice result */}
                {voiceResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: "16px 18px", borderRadius: 12, marginBottom: 20, background: voiceResult.fraud_prob <= 0.5 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${voiceResult.fraud_prob <= 0.5 ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      {voiceResult.fraud_prob <= 0.5 ? <CheckCircle size={28} color="var(--success)" /> : <AlertTriangle size={28} color="var(--danger)" />}
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 15, color: voiceResult.fraud_prob <= 0.5 ? "var(--success)" : "var(--danger)" }}>
                          {voiceResult.prediction}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Model: {voiceResult.model_used}</p>
                      </div>
                    </div>
                    <ScoreBar
                      label="Voice Fraud Risk"
                      value={Math.round(voiceResult.fraud_prob * 100)}
                      color={voiceResult.fraud_prob <= 0.5 ? "var(--success)" : "var(--danger)"}
                    />
                    {voiceResult.matched_keywords.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Flagged keywords:</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {voiceResult.matched_keywords.map((kw, i) => (
                            <span key={i} style={{ padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "rgba(239,68,68,0.12)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)" }}>⚠️ {kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className="btn-ghost" onClick={() => setStep(1)} style={{ flex: 1, height: 46 }}>← Back</button>
                  <button type="button" id="voice-next-submit" className="btn-primary" onClick={() => { setStep(3); handleSubmit(); }} disabled={!voiceResult || loading}
                    style={{ flex: 2, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: voiceResult ? 1 : 0.5 }}>
                    {!voiceResult
                      ? <><Lock size={15} /> Analyze Voice to Continue</>
                      : loading
                        ? <><Loader2 size={15} className="spin-slow" /> Calculating…</>
                        : <><FileText size={15} /> Submit &amp; Get Final Score <ChevronRight size={16} /></>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════ STEP 3: Results ══════════ */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              {loading && (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <Loader2 size={48} className="spin-slow" style={{ margin: "0 auto 16px", color: "var(--accent)" }} />
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Combining all 3 modalities…</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>Financial · KYC · Voice → AI Risk Score</p>
                </div>
              )}

              {error && (
                <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 20px", borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)", marginBottom: 16 }}>
                  <XCircle size={15} style={{ display: "inline", marginRight: 8 }} />{error}
                  <button type="button" className="btn-ghost" onClick={() => setStep(2)} style={{ marginLeft: 12, fontSize: 12 }}>← Try Again</button>
                </div>
              )}

              {result && (() => {
                const cfg = DECISION_CONFIG[result.decision_code];
                const Icon = cfg.icon;
                const scores = getCombinedRisk()!;
                const kycColor = kycResult && kycResult.fraud_prob <= 0.5 ? "var(--success)" : "var(--danger)";
                const vocColor = voiceResult && voiceResult.fraud_prob <= 0.5 ? "var(--success)" : "var(--danger)";
                const combinedColor = scores.combined <= 40 ? "var(--success)" : scores.combined <= 65 ? "var(--warning)" : "var(--danger)";

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
                    {/* Left: Decision + Combined scores */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {/* Decision banner */}
                      <div className="glass-card" style={{ padding: 26 }}>
                        <div style={{ padding: "14px 20px", borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                          <Icon size={26} color={cfg.color} />
                          <div>
                            <p style={{ fontSize: 17, fontWeight: 800, color: cfg.color }}>{cfg.label}</p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                              App ID: <span className="mono">{result.application_id}</span>
                            </p>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
                          <RiskMeter value={scores.combined} size={150} label={`Combined Score: ${result.eligibility_score}`} />
                        </div>

                        {/* Financial summary */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {[
                            { label: "Credit Score",   value: result.financial_summary.credit_score },
                            { label: "Monthly EMI",    value: `₹${result.financial_summary.proposed_emi.toLocaleString()}` },
                            { label: "Debt/Income",    value: `${result.financial_summary.debt_to_income_percent}%` },
                            { label: "Financial Risk", value: `${result.financial_summary.financial_risk}%` },
                          ].map(({ label, value }) => (
                            <div key={label} style={{ padding: 12, borderRadius: 8, background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
                              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</p>
                              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Multimodal score breakdown */}
                      <div className="glass-card" style={{ padding: 22 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
                          📊 Multimodal Risk Breakdown
                        </p>
                        <ScoreBar label="📋 Financial (FT-Transformer) — 50%" value={scores.financial} color={scores.financial <= 40 ? "var(--success)" : scores.financial <= 65 ? "var(--warning)" : "var(--danger)"} />
                        <ScoreBar label="🪪 KYC Document (ViT-B/16) — 30%" value={scores.kyc} color={kycColor} />
                        <ScoreBar label="🎙️ Voice (Whisper + NLP) — 20%" value={scores.voice} color={vocColor} />
                        <div style={{ height: 1, background: "var(--border-color)", margin: "14px 0" }} />
                        <ScoreBar label="⚡ Combined Risk Score" value={scores.combined} color={combinedColor} />
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
                          Formula: Financial × 50% + KYC × 30% + Voice × 20%
                        </p>
                      </div>

                      <button type="button" className="btn-ghost" onClick={resetAll}
                        style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <RefreshCw size={14} /> New Application
                      </button>
                    </div>

                    {/* Right: Risk factors + Bank offers */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {result.factors.length > 0 && (
                        <div className="glass-card" style={{ padding: 22 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Risk Factors</p>
                          <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none" }}>
                            {result.factors.map((f, i) => (
                              <li key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                <TrendingUp size={13} style={{ flexShrink: 0, marginTop: 1, color: "var(--accent)" }} />{f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* ── All 10 Banks: eligible offers + ineligible reasons ── */}
                      <div className="glass-card" style={{ padding: 22 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>🏦 Bank Eligibility — All Partners</p>
                          <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                            <span style={{ color: "var(--success)", fontWeight: 700 }}>✓ {result.bank_recommendations.length} Eligible</span>
                            <span style={{ color: "var(--text-muted)" }}>·</span>
                            <span style={{ color: "var(--danger)", fontWeight: 700 }}>✗ {(result.bank_rules ?? []).length - result.bank_recommendations.length} Not Eligible</span>
                          </div>
                        </div>

                        {/* Eligible banks first — full offer cards */}
                        {result.bank_recommendations.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>✓ Pre-Approved Offers</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {result.bank_recommendations.map(offer => (
                                <div key={offer.bank} style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.3)" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <Building2 size={15} color="var(--success)" />
                                      <div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{offer.bank}</p>
                                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{offer.product}</p>
                                      </div>
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(16,185,129,0.15)", color: "var(--success)" }}>ELIGIBLE</span>
                                  </div>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11, marginBottom: 10 }}>
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, fontWeight: 700, fontSize: 15, color: "var(--accent)" }}><Percent size={11} />{offer.interest_rate}%</div>
                                      <div style={{ color: "var(--text-muted)" }}>Rate p.a.</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>₹{(offer.approved_amount / 100000).toFixed(1)}L</div>
                                      <div style={{ color: "var(--text-muted)" }}>Approved</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}><Clock size={11} />₹{offer.estimated_emi.toLocaleString()}</div>
                                      <div style={{ color: "var(--text-muted)" }}>EMI/mo</div>
                                    </div>
                                  </div>
                                  <p style={{ fontSize: 11, color: "var(--text-secondary)", fontStyle: "italic" }}>{offer.why_recommended}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ineligible banks — show why they failed */}
                        {(result.bank_rules ?? []).some((r: BankRule) => !r.eligible) && (
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>✗ Not Eligible (Reasons)</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {(result.bank_rules ?? []).filter((r: BankRule) => !r.eligible).map((rule: BankRule) => (
                                <div key={rule.bank} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                      <Building2 size={13} color="var(--danger)" />
                                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{rule.bank}</span>
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>NOT ELIGIBLE</span>
                                  </div>
                                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
                                    {rule.reasons.map((r, i) => (
                                      <li key={i} style={{ fontSize: 11, color: "var(--text-secondary)", display: "flex", gap: 5 }}>
                                        <XCircle size={11} style={{ flexShrink: 0, marginTop: 1, color: "var(--danger)" }} />{r}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6, padding: "0 8px" }}>⚠️ {result.disclaimer}</p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes wave  { 0%{height:20%} 100%{height:100%} }
        @keyframes pulse-red {
          0%,100%{box-shadow:0 0 16px rgba(239,68,68,0.2)}
          50%{box-shadow:0 0 28px rgba(239,68,68,0.5), 0 0 0 5px rgba(239,68,68,0.08)}
        }
      `}</style>
    </div>
  );
}
