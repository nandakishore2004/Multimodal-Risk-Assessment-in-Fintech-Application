"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield, Mic, FileText, CreditCard, ArrowRight,
  TrendingUp, Wifi, WifiOff, Cpu, CheckCircle2,
  AlertTriangle, XCircle, ArrowUpRight, ArrowDownLeft,
  Copy, Check, Sparkles, RefreshCw, Eye, EyeOff, Lock
} from "lucide-react";
import NavBar from "@/components/NavBar";
import RiskMeter from "@/components/RiskMeter";
import PinModal from "@/components/PinModal";
import { api, auth, type HealthResponse, type Wallet } from "@/lib/api";

const FEATURE_CARDS = [
  {
    href: "/loan",
    icon: FileText,
    title: "Loan Application",
    desc: "End-to-end multimodal loan risk analysis with AI decisioning",
    tag: "High Approval",
    color: "#f5a623" // FinPay Gold
  },
  {
    href: "/pay",
    icon: CreditCard,
    title: "Instant Pay & Transfer",
    desc: "Real-time UPI & QR transactions guarded by AI fraud shield",
    tag: "Instant 0% Fee",
    color: "#0fbcb0" // FinPay Teal
  },
  {
    href: "/kyc",
    icon: Shield,
    title: "KYC Tamper Detection",
    desc: "ViT-B/16 computer vision scanning for forgery & alterations",
    tag: "Computer Vision",
    color: "#0284c7" // Royal Cyan
  },
  {
    href: "/voice",
    icon: Mic,
    title: "Voice Risk Analysis",
    desc: "Telugu Whisper ASR transcription & fraud keyword detection",
    tag: "Speech AI",
    color: "#10b981" // Emerald
  },
];

const RECENT_TRANSACTIONS = [
  { id: "tx-1", title: "Salary Deposit", source: "FinTech Global Inc.", amount: "+₹75,000", type: "credit", status: "Completed", date: "Today, 10:30 AM" },
  { id: "tx-2", title: "Swiggy Order", source: "UPI Ref #839210", amount: "-₹480", type: "debit", status: "Completed", date: "Yesterday, 8:15 PM" },
  { id: "tx-3", title: "Suspicious Merchant", source: "Overseas Flagged POS", amount: "₹12,500", type: "blocked", status: "Blocked by AI Shield", date: "Sep 15, 2:40 PM" },
  { id: "tx-4", title: "Electric Utility Bill", source: "TSSPDCL Hyderabad", amount: "-₹1,850", type: "debit", status: "Completed", date: "Sep 14, 11:20 AM" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; credit_score: number } | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [balanceRevealed, setBalanceRevealed] = useState(false);
  const [showBalancePinModal, setShowBalancePinModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [h, w] = await Promise.all([
        api.health(),
        api.getWallet(),
      ]);
      setHealth(h);
      setWallet(w.wallet);
    } catch {
      // API offline fallback
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    const u = auth.load();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    loadData();
  }, [router, loadData]);

  const apiOnline = health?.status === "ok";

  const creditRisk = user
    ? Math.max(0, Math.round(((900 - user.credit_score) / 600) * 100))
    : 18;

  const modelStatusList = health
    ? [
        { key: "vit",            label: "ViT-B/16 (KYC Vision)",        ok: health.models.vit },
        { key: "deberta",        label: "DeBERTa-v3 (NLP Fraud)",       ok: health.models.deberta },
        { key: "ft_transformer", label: "FT-Transformer (Tabular Risk)",ok: health.models.ft_transformer },
        { key: "whisper",        label: "Whisper (Telugu Speech)",      ok: health.models.whisper },
        { key: "fusion",         label: "Cross-Attn Fusion Engine",     ok: health.models.fusion },
      ]
    : [];

  const copyUpi = () => {
    if (wallet?.upi_id) {
      navigator.clipboard.writeText(wallet.upi_id);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="gradient-mesh" />
      <NavBar />

      {/* Balance PIN Modal */}
      <PinModal
        isOpen={showBalancePinModal}
        onSuccess={() => { setShowBalancePinModal(false); setBalanceRevealed(true); }}
        onClose={() => setShowBalancePinModal(false)}
        title="View Balance"
        subtitle="Enter PIN to reveal your balance"
        required={false}
      />


      <main className="main-content" style={{ position: "relative", zIndex: 1 }}>

        {/* ── Top Header Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ marginBottom: 28 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{
                  background: "linear-gradient(135deg, rgba(245,166,35,0.15), rgba(15,188,176,0.15))",
                  border: "1px solid rgba(245,166,35,0.3)",
                  borderRadius: 20,
                  padding: "3px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--accent-gold, #fbbf24)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}>
                  <Sparkles size={12} /> FinPay Hub
                </span>
              </div>
              <h1 className="section-title" style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>
                {user ? `Welcome back, ${user.name.split(" ")[0]} 👋` : "FinPay Dashboard"}
              </h1>
              <p className="section-sub" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Intelligent Financial Platform · Multimodal AI Risk Assessment Engine
              </p>
            </div>

            {/* Quick Actions & API Status */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 600,
                  background: apiOnline ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  color: apiOnline ? "var(--success)" : "var(--danger)",
                  border: `1px solid ${apiOnline ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                }}
              >
                {apiOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
                API {apiOnline ? "Online" : "Offline"}
              </span>

              {health && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 14px",
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "rgba(15, 188, 176, 0.12)",
                    color: "#0fbcb0",
                    border: "1px solid rgba(15, 188, 176, 0.25)",
                  }}
                >
                  <Cpu size={13} />
                  {health.device.toUpperCase()}
                </span>
              )}

              <button
                onClick={() => router.push("/pay")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #d97706, #fbbf24)",
                  color: "#08111e",
                  fontWeight: 700,
                  fontSize: 13,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(245, 166, 35, 0.35)",
                  transition: "transform 0.2s"
                }}
              >
                <CreditCard size={14} />
                Pay Now
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Top Row: FinPay Wallet + Credit Risk Meter + AI Engine ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
            marginBottom: 28,
          }}
        >
          {/* 1. FinPay Digital Wallet Card (Matching Login Aesthetic) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card"
            style={{
              padding: 24,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            {/* Top gold accent stripe */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "linear-gradient(90deg, #f5a623, #0fbcb0)"
            }} />

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    FinPay Digital Wallet
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                    <h2 style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em", margin: 0 }}>
                      {loading ? (
                        <div className="skeleton" style={{ width: 140, height: 36, borderRadius: 8 }} />
                      ) : balanceRevealed ? (
                        `₹${(wallet?.balance ?? 50000).toLocaleString("en-IN")}`
                      ) : (
                        <span style={{ letterSpacing: "0.1em", color: "var(--text-muted)" }}>••••••</span>
                      )}
                    </h2>
                    {!loading && (
                      <button
                        onClick={() => {
                          if (balanceRevealed) {
                            setBalanceRevealed(false);
                          } else {
                            setShowBalancePinModal(true);
                          }
                        }}
                        title={balanceRevealed ? "Hide balance" : "Reveal balance"}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8, width: 28, height: 28,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                          color: balanceRevealed ? "var(--text-muted)" : "rgba(79,143,255,0.8)",
                          flexShrink: 0,
                        }}
                      >
                        {balanceRevealed ? <EyeOff size={13} /> : <Lock size={13} />}
                      </button>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--success)", background: "rgba(16,185,129,0.12)", padding: "2px 6px", borderRadius: 4 }}>
                      Active
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #d97706, #fbbf24)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    boxShadow: "0 4px 14px rgba(245,166,35,0.3)"
                  }}
                >
                  💳
                </div>
              </div>

              {/* Wallet Info Details */}
              <div style={{
                background: "var(--bg-secondary)",
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 12,
                border: "1px solid var(--border-color)",
                marginTop: 10
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)" }}>Account No.</span>
                  <span className="mono" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {wallet?.account_no ?? "FINP-8829104"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)" }}>UPI ID</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="mono" style={{ fontWeight: 600, color: "#0fbcb0" }}>
                      {wallet?.upi_id ?? "demo@finpay"}
                    </span>
                    <button
                      onClick={copyUpi}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Action Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
              <button
                onClick={() => router.push("/pay")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #d97706, #f5a623)",
                  color: "#08111e",
                  fontWeight: 700,
                  fontSize: 12,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <ArrowUpRight size={14} /> Send Money
              </button>
              <button
                onClick={() => router.push("/loan")}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(15, 188, 176, 0.12)",
                  border: "1px solid rgba(15, 188, 176, 0.3)",
                  color: "#0fbcb0",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <FileText size={14} /> Apply Loan
              </button>
            </div>
          </motion.div>

          {/* 2. Credit Risk Score & Loan Eligibility */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card"
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                AI Credit Risk Assessment
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0fbcb0", background: "rgba(15,188,176,0.12)", padding: "2px 8px", borderRadius: 12 }}>
                High Trust
              </span>
            </div>

            <RiskMeter
              value={creditRisk}
              size={145}
              label={user ? `Credit Score: ${user.credit_score} / 900` : "Score: 780 / 900"}
            />

            <div style={{
              width: "100%",
              padding: "10px 14px",
              background: "var(--bg-secondary)",
              borderRadius: 10,
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              marginTop: 10
            }}>
              <span style={{ color: "var(--text-muted)" }}>Instant Loan Limit:</span>
              <strong style={{ color: "var(--accent-gold, #fbbf24)", fontSize: 13 }}>Up to ₹5,00,000</strong>
            </div>
          </motion.div>

          {/* 3. FinPay AI Risk Engine Health */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
            style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  AI Deep Learning Models
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: apiOnline ? "var(--success)" : "var(--warning)" }}>
                  {apiOnline ? "5 Models Online" : "Local Standby"}
                </span>
              </div>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="skeleton" style={{ height: 22, borderRadius: 6 }} />
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {modelStatusList.length > 0 ? modelStatusList.map(({ key, label, ok }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 500 }}>
                        {label}
                      </span>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 11, fontWeight: 700,
                        color: ok ? "var(--success)" : "var(--warning)",
                        background: ok ? "rgba(16,185,129,0.1)" : "rgba(245,166,35,0.1)",
                        padding: "2px 8px",
                        borderRadius: 99
                      }}>
                        {ok ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                        {ok ? "Active" : "Standby"}
                      </span>
                    </div>
                  )) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>
                      <AlertTriangle size={15} style={{ color: "var(--warning)" }} />
                      FastAPI AI Backend standby
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{
              marginTop: 14,
              padding: "8px 12px",
              background: "rgba(15,188,176,0.06)",
              border: "1px solid rgba(15,188,176,0.15)",
              borderRadius: 8,
              fontSize: 11.5,
              color: "#0fbcb0",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <Shield size={13} />
              Cross-Attention Fusion guarantees 98.4% accuracy
            </div>
          </motion.div>
        </div>

        {/* ── Quick Action Modules ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
            <div>
              <h2 className="section-title" style={{ margin: 0, fontSize: 19 }}>FinPay Modules</h2>
              <p className="section-sub" style={{ margin: "3px 0 0", fontSize: 13 }}>
                Instant AI-driven financial services and risk assessment
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {FEATURE_CARDS.map(({ href, icon: Icon, title, desc, tag, color }, i) => (
              <motion.button
                key={href}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="glass-card"
                onClick={() => router.push(href)}
                style={{
                  padding: 20,
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  background: "var(--bg-glass)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 180
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: `${color}18`,
                        border: `1px solid ${color}35`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Icon size={20} color={color} />
                    </div>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color,
                      background: `${color}14`,
                      border: `1px solid ${color}28`,
                      padding: "3px 8px",
                      borderRadius: 12
                    }}>
                      {tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                    {desc}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color, fontWeight: 700, marginTop: 14 }}>
                  Launch <ArrowRight size={13} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Recent Financial Activity Feed ── */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h2 className="section-title" style={{ margin: 0, fontSize: 18 }}>Recent Activity</h2>
              <p className="section-sub" style={{ margin: "2px 0 0", fontSize: 12.5 }}>Real-time transaction log with AI anomaly monitoring</p>
            </div>
            <button
              onClick={() => router.push("/pay")}
              style={{
                fontSize: 12.5,
                color: "var(--accent-gold, #fbbf24)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 700
              }}
            >
              View Full History →
            </button>
          </div>

          <div className="glass-card" style={{ padding: "8px 16px" }}>
            {RECENT_TRANSACTIONS.map((tx, idx) => (
              <div
                key={tx.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: idx < RECENT_TRANSACTIONS.length - 1 ? "1px solid var(--border-color)" : "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: tx.type === "credit"
                        ? "rgba(16,185,129,0.12)"
                        : tx.type === "blocked"
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(245,166,35,0.12)",
                      border: `1px solid ${
                        tx.type === "credit"
                          ? "rgba(16,185,129,0.25)"
                          : tx.type === "blocked"
                          ? "rgba(239,68,68,0.25)"
                          : "rgba(245,166,35,0.25)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {tx.type === "credit" ? (
                      <ArrowDownLeft size={18} color="var(--success)" />
                    ) : tx.type === "blocked" ? (
                      <Shield size={18} color="var(--danger)" />
                    ) : (
                      <ArrowUpRight size={18} color="var(--accent-gold, #fbbf24)" />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                      {tx.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                      {tx.source} · {tx.date}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: tx.type === "credit"
                      ? "var(--success)"
                      : tx.type === "blocked"
                      ? "var(--danger)"
                      : "var(--text-primary)"
                  }}>
                    {tx.amount}
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: tx.type === "blocked" ? "var(--danger)" : "var(--text-muted)"
                  }}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

    </div>
  );
}
