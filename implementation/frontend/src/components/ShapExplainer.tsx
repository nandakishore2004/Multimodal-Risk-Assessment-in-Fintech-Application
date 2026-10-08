"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Info, ChevronDown, ChevronUp, Loader2, Zap } from "lucide-react";

interface ShapValue {
  feature: string;
  value: number;
  shap: number;
  contribution_pct: number;
  direction: "risk" | "safe";
}

interface ShapResult {
  method: string;
  shap_values: ShapValue[];
  predicted_prob: number;
  note: string;
}

interface ShapExplainerProps {
  amount?: number;
  txType?: number;
  oldBalanceOrg?: number;
  oldBalanceDest?: number;
  step?: number;
  autoLoad?: boolean;
}

export default function ShapExplainer({ amount = 10000, txType = 4, oldBalanceOrg = 50000, oldBalanceDest = 0, step = 1 }: ShapExplainerProps) {
  const [result, setResult] = useState<ShapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState("");

  const explain = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shap_explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, type: txType, oldbalanceOrg: oldBalanceOrg, oldbalanceDest: oldBalanceDest, step }),
      });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.error || "Explanation failed");
    } catch {
      setError("Network error — check Flask server");
    } finally {
      setLoading(false);
    }
  }, [amount, txType, oldBalanceOrg, oldBalanceDest, step]);

  return (
    <div className="glass-card" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(79,143,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={15} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>AI Explainability</p>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>Why was this flagged?</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {result && (
            <button onClick={() => setExpanded(e => !e)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={explain}
            disabled={loading}
            id="shap-explain-btn"
            style={{
              fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 8,
              background: "linear-gradient(135deg, rgba(79,143,255,0.2), rgba(15,188,176,0.15))",
              border: "1px solid var(--accent)", color: "var(--accent)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {loading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={12} />}
            {loading ? "Analyzing..." : "Explain Risk"}
          </motion.button>
        </div>
      </div>

      {error && <p style={{ fontSize: 12, color: "var(--danger)", padding: "8px 12px", background: "rgba(255,77,109,0.08)", borderRadius: 8, margin: 0 }}>{error}</p>}

      <AnimatePresence>
        {result && expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            {/* Predicted probability */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: result.predicted_prob > 0.5 ? "rgba(255,77,109,0.08)" : "rgba(0,232,135,0.08)", border: "1px solid " + (result.predicted_prob > 0.5 ? "rgba(255,77,109,0.2)" : "rgba(0,232,135,0.2)"), marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Model Fraud Probability</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: result.predicted_prob > 0.5 ? "var(--danger)" : "var(--success)" }}>
                {(result.predicted_prob * 100).toFixed(1)}%
              </span>
            </div>

            {/* SHAP bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.shap_values.map((sv, i) => (
                <motion.div key={sv.feature} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {sv.direction === "risk"
                        ? <TrendingUp size={11} style={{ color: "var(--danger)" }} />
                        : <TrendingDown size={11} style={{ color: "var(--success)" }} />}
                      <span style={{ fontSize: 11.5, color: "var(--text-primary)", fontWeight: 600 }}>{sv.feature}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sv.direction === "risk" ? "var(--danger)" : "var(--success)" }}>
                      {sv.direction === "risk" ? "+" : "-"}{sv.contribution_pct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "var(--bg-secondary)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: Math.min(sv.contribution_pct, 100) + "%" }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      style={{
                        height: "100%", borderRadius: 99,
                        background: sv.direction === "risk"
                          ? "linear-gradient(90deg, #ff4d6d, #ff8fa3)"
                          : "linear-gradient(90deg, #00e887, #34d399)",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 12, padding: "8px 10px", borderRadius: 8, background: "var(--bg-glass-2)" }}>
              <Info size={11} style={{ color: "var(--text-muted)", marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                {result.note} · <em>{result.method}</em>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
