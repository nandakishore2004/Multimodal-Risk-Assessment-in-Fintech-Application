"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Shield, CreditCard, FileText, Mic, RefreshCw, ChevronRight, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface RiskEvent {
  id: string;
  timestamp: string;
  type: string;
  label: string;
  risk_score: number;
  verdict: string;
  details: string;
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  payment:    { icon: <CreditCard size={13} />,  color: "#4f8fff" },
  kyc:        { icon: <Shield size={13} />,       color: "#0fbcb0" },
  loan:       { icon: <FileText size={13} />,     color: "#fbbf24" },
  voice:      { icon: <Mic size={13} />,          color: "#10b981" },
  assessment: { icon: <Shield size={13} />,       color: "#7c6aff" },
};

function getRiskColor(score: number) {
  if (score >= 60) return "var(--danger)";
  if (score >= 30) return "var(--warning)";
  return "var(--success)";
}

function getRiskIcon(score: number) {
  if (score >= 60) return <XCircle size={13} />;
  if (score >= 30) return <AlertTriangle size={13} />;
  return <CheckCircle size={13} />;
}

export default function RiskHistory() {
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/risk_history");
      const data = await res.json();
      if (data.success) setEvents(data.history);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const demoSeed = useCallback(async () => {
    const demos = [
      { type: "payment", label: "Payment ₹50,000 → lottery_claim_99@upi", risk_score: 89, verdict: "BLOCKED — High Risk", details: "XGBoost detected fraud pattern. Receiver account is a known mule." },
      { type: "kyc", label: "KYC Document Upload — Aadhaar", risk_score: 8, verdict: "VERIFIED — Low Risk", details: "ViT-B/16 found no visual anomalies. Document structure accepted." },
      { type: "payment", label: "Payment ₹480 → Swiggy UPI", risk_score: 11, verdict: "APPROVED — Low Risk", details: "Regular merchant payment. No fraud signals detected." },
      { type: "loan", label: "Loan Application ₹5,00,000 — SBI", risk_score: 34, verdict: "MANUAL REVIEW", details: "Credit score 720, DTI 42%. Borderline eligibility." },
      { type: "voice", label: "Telugu Voice Authentication", risk_score: 15, verdict: "AUTHENTIC — Normal Pattern", details: "No suspicious Telugu/English keywords detected in transcript." },
    ];
    for (const d of demos) {
      await fetch("/api/risk_history/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
    }
    load();
  }, [load]);

  return (
    <div className="glass-card" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(15,188,176,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={15} style={{ color: "var(--accent-2)" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Risk History</p>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>All assessment events</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {events.length === 0 && (
            <button onClick={demoSeed} style={{ fontSize: 10, padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border-bright)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>
              Load Demo
            </button>
          )}
          <button onClick={load} disabled={loading} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
            <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>
          <Clock size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p style={{ fontSize: 13, margin: 0 }}>No assessments yet</p>
          <p style={{ fontSize: 11, margin: "4px 0 0" }}>Run a payment, KYC, or loan check to see history</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {events.map((evt, i) => {
            const meta = TYPE_META[evt.type] ?? TYPE_META["assessment"];
            const rc = getRiskColor(evt.risk_score);
            const isExp = expanded === evt.id;
            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setExpanded(isExp ? null : evt.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "var(--bg-glass-2)",
                  border: "1px solid var(--border-color)",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Type icon */}
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: meta.color + "20", display: "flex", alignItems: "center", justifyContent: "center", color: meta.color, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{evt.label}</p>
                    <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: "2px 0 0" }}>{evt.timestamp}</p>
                  </div>
                  {/* Risk badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <span style={{ color: rc }}>{getRiskIcon(evt.risk_score)}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: rc }}>{evt.risk_score}</span>
                    <ChevronRight size={12} style={{ color: "var(--text-muted)", transform: isExp ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExp && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-color)" }}
                    >
                      <p style={{ fontSize: 11.5, fontWeight: 600, color: rc, margin: "0 0 4px" }}>{evt.verdict}</p>
                      {evt.details && <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{evt.details}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
