"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Shield } from "lucide-react";

interface ComplianceRule {
  code: string;
  title: string;
  description: string;
  status: "compliant" | "attention" | "required";
  applicability: string;
}

const ALL_RULES: ComplianceRule[] = [
  {
    code: "RBI/2023-24/73",
    title: "Large Value Transaction Monitoring",
    description: "Transactions above ₹10 Lakh must be flagged and monitored for suspicious activity patterns. Real-time AI screening is recommended.",
    status: "compliant",
    applicability: "Payments > ₹10,00,000"
  },
  {
    code: "PMLA 2002 — Sec 12",
    title: "Suspicious Transaction Reporting (STR)",
    description: "Banks must file Suspicious Transaction Reports with FIU-India within 7 days of identifying suspicious activity. AI-flagged transactions trigger STR workflow.",
    status: "compliant",
    applicability: "All flagged transactions"
  },
  {
    code: "KYC Master Direction 2016",
    title: "KYC Verification — Aadhaar / PAN",
    description: "Periodic KYC re-verification required. Digital KYC using Aadhaar OTP/biometrics accepted. Document tampering must be detected using computer vision.",
    status: "compliant",
    applicability: "All new accounts & loans"
  },
  {
    code: "RBI PA/PG Guidelines 2020",
    title: "Payment Aggregator Fraud Controls",
    description: "Real-time transaction monitoring, velocity checks, and second-factor authentication required for digital payment platforms.",
    status: "compliant",
    applicability: "UPI & digital payments"
  },
  {
    code: "IT Act 2000 — Sec 43A",
    title: "Data Security & Privacy",
    description: "Sensitive financial data must be encrypted. User biometric data (voice, image) must be processed in compliance with data localisation norms.",
    status: "attention",
    applicability: "Voice & KYC data"
  },
  {
    code: "RBI Digital Lending 2022",
    title: "AI-Aided Loan Decisioning Disclosure",
    description: "AI-driven credit decisions must disclose the key factors to applicants. Explainable AI (XAI) with SHAP values meets this requirement.",
    status: "compliant",
    applicability: "Loan assessments"
  },
  {
    code: "EU AI Act 2024 (Reference)",
    title: "High-Risk AI System Obligations",
    description: "Financial risk assessment AI classified as high-risk. Requires human oversight, audit trails, and model transparency documentation.",
    status: "required",
    applicability: "All AI predictions"
  },
];

const STATUS_META = {
  compliant: { color: "var(--success)", bg: "rgba(0,232,135,0.08)", border: "rgba(0,232,135,0.2)", icon: <CheckCircle size={12} />, label: "Compliant" },
  attention:  { color: "var(--warning)", bg: "rgba(255,179,71,0.08)", border: "rgba(255,179,71,0.2)", icon: <AlertTriangle size={12} />, label: "Attention" },
  required:   { color: "var(--accent)", bg: "rgba(79,143,255,0.08)", border: "rgba(79,143,255,0.2)", icon: <Shield size={12} />, label: "Required" },
};

export default function CompliancePanel({ riskScore = 0 }: { riskScore?: number }) {
  const [open, setOpen] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const relevantRules = riskScore > 60
    ? ALL_RULES
    : riskScore > 30
    ? ALL_RULES.slice(0, 5)
    : ALL_RULES.slice(0, 3);

  const compliantCount = relevantRules.filter(r => r.status === "compliant").length;

  return (
    <div className="glass-card" style={{ padding: "18px 20px" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(251,191,36,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scale size={15} style={{ color: "var(--accent-gold)" }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Indian Regulatory Compliance</p>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>RBI · PMLA · KYC · IT Act · EU AI Act</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", background: "rgba(0,232,135,0.1)", padding: "3px 8px", borderRadius: 99 }}>
            {compliantCount}/{relevantRules.length} Met
          </span>
          {open ? <ChevronUp size={15} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}
          >
            {relevantRules.map((rule, i) => {
              const meta = STATUS_META[rule.status];
              const isExp = expandedRule === rule.code;
              return (
                <motion.div key={rule.code} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => setExpandedRule(isExp ? null : rule.code)}
                  style={{
                    padding: "10px 12px", borderRadius: 10,
                    background: meta.bg, border: "1px solid " + meta.border, cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{rule.title}</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0", fontFamily: "JetBrains Mono, monospace" }}>{rule.code}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                      {isExp ? <ChevronUp size={12} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + meta.border }}
                      >
                        <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>{rule.description}</p>
                        <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: "6px 0 0" }}>
                          <strong>Applies to:</strong> {rule.applicability}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            <p style={{ fontSize: 10.5, color: "var(--text-muted)", textAlign: "center", margin: "4px 0 0", lineHeight: 1.5 }}>
              FinPay AI decisions are logged for audit trail compliance. This is a prototype — consult a licensed compliance officer for production deployment.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
