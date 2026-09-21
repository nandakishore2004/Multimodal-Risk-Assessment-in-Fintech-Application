"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Shield, CheckCircle, AlertTriangle, XCircle,
  Image as ImageIcon, Loader2, ScanLine, User, Calendar,
  Hash, MapPin, FileText, Fingerprint, ChevronDown, ChevronUp
} from "lucide-react";
import NavBar from "@/components/NavBar";
import RiskMeter from "@/components/RiskMeter";
import { api, type KycResponse, type KycOcrResponse } from "@/lib/api";

type OcrField = { label: string; value: string; icon: React.ReactNode; mono?: boolean };

export default function KycPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [result, setResult] = useState<KycResponse | null>(null);
  const [ocrResult, setOcrResult] = useState<KycOcrResponse | null>(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Only image files (JPG, PNG, WEBP) are supported.");
      return;
    }
    setFile(f);
    setError("");
    setResult(null);
    setOcrResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // Run both analyses together
  const analyzeAll = async () => {
    if (!file) return;
    setLoading(true);
    setOcrLoading(true);
    setError("");

    // Run tampering analysis first
    const vitRes = await api.analyzeKyc(file).catch((e) => { setError(e.message); return null; });
    if (vitRes) setResult(vitRes);

    // Then run OCR sequentially to avoid backend PyTorch GIL lock / timeout
    const ocrRes = await api.kycOcr(file).catch(() => null);
    if (ocrRes) setOcrResult(ocrRes);

    setLoading(false);
    setOcrLoading(false);
  };

  const riskPct = result ? Math.round(result.fraud_prob * 100) : 0;
  const isAuthentic = result && result.fraud_prob <= 0.5;

  const ocrFields: OcrField[] = ocrResult
    ? [
        { label: "Full Name",      value: ocrResult.extracted.name,           icon: <User size={14} /> },
        { label: "Date of Birth",  value: ocrResult.extracted.dob,            icon: <Calendar size={14} /> },
        { label: "Gender",         value: ocrResult.extracted.gender,         icon: <FileText size={14} /> },
        { label: "Aadhaar No.",    value: ocrResult.extracted.aadhaar_number, icon: <Fingerprint size={14} />, mono: true },
        { label: "Address",        value: ocrResult.extracted.address,        icon: <MapPin size={14} /> },
        { label: "PIN Code",       value: ocrResult.extracted.pincode,        icon: <Hash size={14} />,        mono: true },
      ]
    : [];

  return (
    <div className="page-wrapper">
      <div className="gradient-mesh" />
      <div className="gradient-mesh-grid" />
      <NavBar />
      <main className="main-content" style={{ position: "relative", zIndex: 1 }}>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, rgba(79,143,255,0.2), rgba(124,58,237,0.2))",
              border: "1px solid rgba(79,143,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Shield size={20} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h1 className="section-title">KYC Document Verification</h1>
              <p className="section-sub">ViT-B/16 anomaly detection · Roboflow + EasyOCR extraction</p>
            </div>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

          {/* ── Left: Upload + OCR fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Upload card */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="card-3d-wrapper"
            >
              <div
                className="glass-card card-3d"
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                style={{
                  padding: 28,
                  textAlign: "center",
                  cursor: "pointer",
                  border: `2px dashed ${drag ? "var(--accent)" : "var(--border-color)"}`,
                  background: drag ? "rgba(79,143,255,0.08)" : "var(--bg-glass)",
                  transition: "all 0.25s",
                }}
                onClick={() => document.getElementById("kyc-file-input")?.click()}
              >
                <input
                  id="kyc-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                <AnimatePresence mode="wait">
                  {preview ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt="KYC document preview"
                        style={{
                          maxWidth: "100%", maxHeight: 220,
                          borderRadius: 12, objectFit: "contain",
                          border: "1px solid var(--border-bright)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                        }}
                      />
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
                        📄 {file?.name} ({((file?.size ?? 0) / 1024).toFixed(0)} KB)
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ padding: "28px 0" }}
                    >
                      <div style={{
                        width: 64, height: 64, borderRadius: 16,
                        background: "linear-gradient(135deg, rgba(79,143,255,0.15), rgba(124,58,237,0.1))",
                        border: "1px solid rgba(79,143,255,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 16px",
                        boxShadow: "0 8px 24px rgba(79,143,255,0.2)"
                      }}>
                        <ImageIcon size={28} style={{ color: "var(--accent)" }} />
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                        Drop KYC document here
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                        or click to browse — JPG, PNG, WEBP
                      </p>
                      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                        {["Aadhaar Card", "PAN Card", "Passport"].map((t) => (
                          <span key={t} className="badge badge-info" style={{ fontSize: 10 }}>{t}</span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  className="btn-primary"
                  onClick={analyzeAll}
                  disabled={!file || loading}
                  style={{ flex: 1, height: 46 }}
                  id="kyc-analyze-btn"
                >
                  {loading
                    ? <><Loader2 size={16} className="spin-slow" /> Analyzing…</>
                    : <><ScanLine size={16} /> Analyze &amp; Extract</>
                  }
                </button>
                {file && (
                  <button
                    className="btn-ghost"
                    onClick={() => { setFile(null); setPreview(null); setResult(null); setOcrResult(null); }}
                    style={{ height: 46, padding: "0 16px" }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: 12, padding: "10px 14px", borderRadius: 10,
                    background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.3)",
                    color: "var(--danger)", fontSize: 13, display: "flex", gap: 8
                  }}
                >
                  <XCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  {error}
                </motion.div>
              )}
            </motion.div>

            {/* OCR Extracted Info */}
            <AnimatePresence>
              {(ocrLoading || ocrResult) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass-card"
                  style={{ padding: 22 }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <ScanLine size={14} style={{ color: "var(--accent-cyan)" }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        Extracted Information
                      </p>
                    </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {ocrResult && ocrResult.document_type && (
                      <span className="badge badge-info" style={{ fontSize: 10 }}>
                        📄 {ocrResult.document_type}
                      </span>
                    )}
                    {ocrResult && (
                      <span className="badge badge-success" style={{ fontSize: 10 }}>
                        {ocrResult.ocr_engine ?? "OCR"}
                      </span>
                    )}
                  </div>
                  </div>

                  {ocrLoading && !ocrResult ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[80, 60, 70, 90, 55, 40].map((w, i) => (
                        <div key={i} className="skeleton" style={{ height: 44, width: `${w}%` }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {ocrFields.map((f) => (
                        <div key={f.label} className="ocr-field-row">
                          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent)", minWidth: 90 }}>
                            {f.icon}
                            <span className="ocr-field-label">{f.label}</span>
                          </div>
                          <span
                            className="ocr-field-value"
                            style={f.mono ? { fontFamily: "JetBrains Mono, monospace", fontSize: 13, letterSpacing: "0.04em" } : {}}
                          >
                            {f.value}
                          </span>
                        </div>
                      ))}

                      {/* Raw text toggle */}
                      {ocrResult?.raw_text && (
                        <div style={{ marginTop: 6 }}>
                          <button
                            className="btn-ghost"
                            onClick={() => setShowRaw((v) => !v)}
                            style={{ width: "100%", height: 34, fontSize: 12 }}
                          >
                            {showRaw ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {showRaw ? "Hide raw text" : "Show raw OCR text"}
                          </button>
                          <AnimatePresence>
                            {showRaw && (
                              <motion.pre
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{
                                  marginTop: 8,
                                  padding: 12,
                                  background: "rgba(0,0,0,0.4)",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontFamily: "JetBrains Mono, monospace",
                                  color: "var(--text-secondary)",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                  overflow: "hidden"
                                }}
                              >
                                {ocrResult.raw_text}
                              </motion.pre>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {ocrResult?.confidence_note && (
                        <div style={{
                          padding: "8px 12px", borderRadius: 8,
                          background: "rgba(255,179,71,0.06)", border: "1px solid rgba(255,179,71,0.2)",
                          display: "flex", gap: 6, alignItems: "flex-start", marginTop: 4
                        }}>
                          <AlertTriangle size={12} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }} />
                          <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                            {ocrResult.confidence_note}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: Tampering Analysis Results */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="glass-card"
                  style={{ padding: 28 }}
                >
                  {/* ViT model advisory note */}
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: "12px 16px", borderRadius: 12, marginBottom: 20,
                      background: "rgba(255,179,71,0.06)", border: "1px solid rgba(255,179,71,0.2)",
                      display: "flex", gap: 10
                    }}
                  >
                    <AlertTriangle size={14} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--warning)", marginBottom: 3 }}>Model Advisory</p>
                      <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        ViT was trained on <strong>synthetic cartoon-like images</strong>. Real Aadhaar cards scoring low (green) means the document looks structurally normal — <strong>not fake</strong>. Only scores above 85% flag tampering.
                      </p>
                    </div>
                  </motion.div>

                  {/* Verdict banner */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: "16px 20px", borderRadius: 14, marginBottom: 28,
                      background: isAuthentic ? "rgba(0,232,135,0.08)" : "rgba(255,77,109,0.08)",
                      border: `1px solid ${isAuthentic ? "rgba(0,232,135,0.3)" : "rgba(255,77,109,0.3)"}`,
                      display: "flex", alignItems: "center", gap: 14,
                      boxShadow: isAuthentic ? "0 0 24px rgba(0,232,135,0.12)" : "0 0 24px rgba(255,77,109,0.12)"
                    }}
                  >
                    {isAuthentic
                      ? <CheckCircle size={26} color="var(--success)" />
                      : <XCircle size={26} color="var(--danger)" />
                    }
                    <div>
                      <p style={{
                        fontSize: 16, fontWeight: 700,
                        color: isAuthentic ? "var(--success)" : "var(--danger)"
                      }}>
                        {result.prediction}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
                        {result.model_used}
                      </p>
                    </div>
                  </motion.div>

                  {/* Risk Meter */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                    <RiskMeter value={riskPct} size={150} label="Tampering Probability" />
                  </div>

                  {/* Fraud probability bar */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 12, color: "var(--text-secondary)", marginBottom: 8
                    }}>
                      <span style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 11 }}>
                        Fraud Probability
                      </span>
                      <span style={{ fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: isAuthentic ? "var(--success)" : "var(--danger)" }}>
                        {(result.fraud_prob * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.fraud_prob * 100}%` }}
                        transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                        style={{
                          height: "100%",
                          borderRadius: 99,
                          background: isAuthentic
                            ? "linear-gradient(90deg, #00e887, #00c9ff)"
                            : "linear-gradient(90deg, #ff4d6d, #ff8c42)",
                          boxShadow: isAuthentic
                            ? "0 0 12px rgba(0,232,135,0.5)"
                            : "0 0 12px rgba(255,77,109,0.5)"
                        }}
                      />
                    </div>
                  </div>

                  {/* Risk level indicators */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
                    {[
                      { label: "Low Risk", range: "0–30%", active: riskPct < 30, color: "var(--success)", bg: "rgba(0,232,135,0.08)", border: "rgba(0,232,135,0.25)" },
                      { label: "Medium",   range: "30–60%", active: riskPct >= 30 && riskPct < 60, color: "var(--warning)", bg: "rgba(255,179,71,0.08)", border: "rgba(255,179,71,0.25)" },
                      { label: "High Risk", range: "60–100%", active: riskPct >= 60, color: "var(--danger)", bg: "rgba(255,77,109,0.08)", border: "rgba(255,77,109,0.25)" },
                    ].map((tier) => (
                      <div
                        key={tier.label}
                        style={{
                          padding: "8px 10px", borderRadius: 10, textAlign: "center",
                          background: tier.active ? tier.bg : "rgba(255,255,255,0.02)",
                          border: `1px solid ${tier.active ? tier.border : "var(--border-color)"}`,
                          transition: "all 0.3s"
                        }}
                      >
                        <p style={{ fontSize: 10, fontWeight: 700, color: tier.active ? tier.color : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {tier.label}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{tier.range}</p>
                      </div>
                    ))}
                  </div>

                  {/* Guidance */}
                  <div style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.025)", border: "1px solid var(--border-color)"
                  }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <AlertTriangle size={14} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                        {result.guidance}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card"
                  style={{ padding: 56, textAlign: "center" }}
                >
                  <div style={{
                    width: 80, height: 80, borderRadius: 20, margin: "0 auto 20px",
                    background: "linear-gradient(135deg, rgba(79,143,255,0.1), rgba(124,58,237,0.08))",
                    border: "1px solid rgba(79,143,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Shield size={36} style={{ color: "var(--accent)", opacity: 0.5 }} />
                  </div>
                  <p style={{ fontSize: 15, color: "var(--text-secondary)", fontWeight: 500 }}>
                    Upload a KYC document
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>
                    AI will detect tampering + extract fields<br />simultaneously
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
