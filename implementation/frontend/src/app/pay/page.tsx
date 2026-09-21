"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Send, ShieldAlert, ShieldCheck, ShieldOff,
  Loader2, Wallet, AlertTriangle, RefreshCw, MessageCircle,
  CheckCircle2, XCircle, Zap, ArrowRight
} from "lucide-react";
import NavBar from "@/components/NavBar";
import RiskMeter from "@/components/RiskMeter";
import PinModal from "@/components/PinModal";
import { api, type PaymentResponse, type Wallet as WalletType } from "@/lib/api";

const RECIPIENTS = [
  { id: "ananya@okhdfcbank",    name: "Ananya Verma",            type: "Friend",         emoji: "👤", safe: true  },
  { id: "electricity@bescom",   name: "BESCOM Electricity Bill",  type: "Merchant",       emoji: "🏢", safe: true  },
  { id: "lottery_claim_99@upi", name: "KBC Lottery Support",      type: "Suspicious UPI", emoji: "⚠️", safe: false },
  { id: "custom",               name: "Custom Recipient",         type: "Manual",         emoji: "✏️", safe: true  },
];

const STATUS_CONFIG: Record<string, {
  icon: typeof ShieldCheck;
  color: string;
  bg: string;
  border: string;
  label: string;
  glow: string;
}> = {
  APPROVED: {
    icon: ShieldCheck,
    color: "var(--success)",
    bg: "rgba(0,232,135,0.08)",
    border: "rgba(0,232,135,0.3)",
    label: "Payment Approved ✅",
    glow: "0 0 30px rgba(0,232,135,0.2)"
  },
  BLOCKED: {
    icon: ShieldOff,
    color: "var(--danger)",
    bg: "rgba(255,77,109,0.08)",
    border: "rgba(255,77,109,0.3)",
    label: "Payment Blocked 🚫",
    glow: "0 0 30px rgba(255,77,109,0.2)"
  },
  FLAGGED: {
    icon: ShieldAlert,
    color: "var(--warning)",
    bg: "rgba(255,179,71,0.08)",
    border: "rgba(255,179,71,0.3)",
    label: "Flagged for Review ⚠️",
    glow: "0 0 30px rgba(255,179,71,0.2)"
  },
  INSUFFICIENT_FUNDS: {
    icon: AlertTriangle,
    color: "var(--danger)",
    bg: "rgba(255,77,109,0.08)",
    border: "rgba(255,77,109,0.3)",
    label: "Insufficient Funds",
    glow: "0 0 30px rgba(255,77,109,0.2)"
  },
  PENDING_TELEGRAM: {
    icon: MessageCircle,
    color: "#2596d2",
    bg: "rgba(37,150,210,0.08)",
    border: "rgba(37,150,210,0.35)",
    label: "Waiting for Telegram ⏳",
    glow: "0 0 30px rgba(37,150,210,0.2)"
  },
};

export default function PayPage() {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState(RECIPIENTS[0]);
  const [customRecipient, setCustomRecipient] = useState({ id: "", name: "" });
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);

  const loadWallet = useCallback(async () => {
    try {
      const w = await api.getWallet();
      setWallet(w.wallet);
    } catch {/* API offline */}
  }, []);

  useEffect(() => { loadWallet(); }, [loadWallet]);

  // ── Poll Telegram status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (result?.status === "PENDING_TELEGRAM" && result.tx_id) {
      interval = setInterval(async () => {
        setPollCount((c) => c + 1);
        try {
          const res = await api.payStatus(result.tx_id);

          if (res.status === "APPROVED") {
            clearInterval(interval);
            // Update wallet balance from status response
            if (res.new_balance !== undefined) {
              setWallet((w) => w ? { ...w, balance: res.new_balance } : w);
            } else {
              loadWallet();
            }
            setResult((prev) => prev
              ? {
                  ...prev,
                  status: "APPROVED",
                  success: true,
                  title: res.title ?? "Payment Successful!",
                  message: res.message ?? "Telegram verification approved! Funds transferred.",
                  new_balance: res.new_balance,
                }
              : prev
            );
          } else if (res.status === "DECLINED") {
            clearInterval(interval);
            setResult((prev) => prev
              ? {
                  ...prev,
                  status: "BLOCKED",
                  success: false,
                  title: res.title ?? "Payment Declined",
                  message: res.message ?? "You declined this transaction in Telegram.",
                }
              : prev
            );
          }
        } catch {/* ignore poll errors */}
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [result?.status, result?.tx_id, loadWallet]);

  // Step 1: form submit → show PIN modal
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipient = selectedRecipient.id === "custom" ? customRecipient : selectedRecipient;
    setPendingPayload({
      recipient_id: recipient.id,
      recipient_name: recipient.name,
      amount: parseFloat(amount),
      note,
    });
    setShowPinModal(true);
  };

  // Step 2: PIN verified → actually send payment
  const handlePinSuccess = async () => {
    setShowPinModal(false);
    if (!pendingPayload) return;
    setError("");
    setResult(null);
    setLoading(true);
    setPollCount(0);
    try {
      const res = await api.pay(pendingPayload);
      setResult(res);
      if (res.success && res.new_balance !== undefined) {
        setWallet((w) => w ? { ...w, balance: res.new_balance! } : w);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
      setPendingPayload(null);
    }
  };

  const QUICK_AMOUNTS = [500, 1000, 5000, 15000];

  return (
    <div className="page-wrapper">
      <div className="gradient-mesh" />
      <div className="gradient-mesh-grid" />
      <NavBar />

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onSuccess={handlePinSuccess}
        onClose={() => { setShowPinModal(false); setPendingPayload(null); }}
        title="Enter UPI PIN"
        subtitle={`Authorise ₹${amount || "0"} payment`}
        required={false}
      />

      <main className="main-content" style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, rgba(255,179,71,0.2), rgba(255,77,109,0.15))",
              border: "1px solid rgba(255,179,71,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Zap size={20} style={{ color: "var(--warning)" }} />
            </div>
            <div>
              <h1 className="section-title">AI-Protected Payments</h1>
              <p className="section-sub">GPay/PhonePe-style UPI with real-time fraud detection</p>
            </div>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

          {/* ── Left: Form */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* 3D Payment Card Visual */}
            <div className="payment-card-3d">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                    {wallet?.bank_name ?? "State Bank of India"}
                  </p>
                  <p className="stat-number" style={{ fontSize: 26 }}>
                    ₹{wallet ? wallet.balance.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "—"}
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Available Balance</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Wallet size={18} color="rgba(255,255,255,0.8)" />
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={loadWallet}
                    style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6 }}
                  >
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
              </div>
              <div className="neon-divider" style={{ margin: "16px 0", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em" }}>
                  {wallet?.account_no ?? "•••• •••• •••• 4219"}
                </p>
                <span className="badge badge-success" style={{ fontSize: 10 }}>ACTIVE</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                UPI: {wallet?.upi_id ?? "svnkishore@oksbi"}
              </p>
            </div>

            {/* Payment form */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
                Send Money
              </h2>
              <form onSubmit={handlePay} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Recipient picker */}
                <div>
                  <label className="input-label">Select Recipient</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {RECIPIENTS.map((r) => (
                      <motion.button
                        key={r.id}
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedRecipient(r)}
                        style={{
                          padding: "12px 16px", borderRadius: 12, border: "1px solid",
                          textAlign: "left", cursor: "pointer", transition: "all 0.18s",
                          background: selectedRecipient.id === r.id
                            ? r.safe ? "rgba(79,143,255,0.1)" : "rgba(255,77,109,0.08)"
                            : "rgba(255,255,255,0.02)",
                          borderColor: selectedRecipient.id === r.id
                            ? r.safe ? "var(--accent)" : "var(--danger)"
                            : "var(--border-color)",
                          boxShadow: selectedRecipient.id === r.id
                            ? r.safe ? "0 0 16px rgba(79,143,255,0.15)" : "0 0 16px rgba(255,77,109,0.15)"
                            : "none"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{r.emoji}</span>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.name}</p>
                              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{r.type}</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {!r.safe && (
                              <span className="badge badge-danger" style={{ fontSize: 10 }}>HIGH RISK</span>
                            )}
                            {selectedRecipient.id === r.id && (
                              <CheckCircle2 size={16} color={r.safe ? "var(--accent)" : "var(--danger)"} />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {selectedRecipient.id === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}
                    >
                      <div>
                        <label className="input-label">UPI ID</label>
                        <input
                          className="input-field"
                          value={customRecipient.id}
                          onChange={(e) => setCustomRecipient((c) => ({ ...c, id: e.target.value }))}
                          placeholder="name@bank"
                          required
                        />
                      </div>
                      <div>
                        <label className="input-label">Name</label>
                        <input
                          className="input-field"
                          value={customRecipient.name}
                          onChange={(e) => setCustomRecipient((c) => ({ ...c, name: e.target.value }))}
                          placeholder="Recipient name"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="input-label">Amount (₹)</label>
                  <input
                    className="input-field"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                    placeholder="0.00"
                    style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    {QUICK_AMOUNTS.map((a) => (
                      <motion.button
                        key={a}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-ghost"
                        onClick={() => setAmount(String(a))}
                        style={{ flex: 1, padding: "6px 0", fontSize: 12, fontWeight: 700 }}
                      >
                        ₹{a >= 1000 ? `${a / 1000}K` : a}
                      </motion.button>
                    ))}
                  </div>
                  {Number(amount) >= 15000 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: 8, padding: "8px 12px", borderRadius: 8,
                        background: "rgba(37,150,210,0.08)", border: "1px solid rgba(37,150,210,0.25)",
                        display: "flex", alignItems: "center", gap: 6, fontSize: 12
                      }}
                    >
                      <MessageCircle size={12} style={{ color: "#2596d2" }} />
                      <span style={{ color: "#2596d2" }}>Telegram verification required for amounts ≥ ₹15,000</span>
                    </motion.div>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="input-label">Note (optional)</label>
                  <input
                    className="input-field"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Rent, groceries, urgent help…"
                  />
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
                    💡 Try suspicious words like &quot;OTP&quot;, &quot;urgent&quot; to see AI blocking
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.3)",
                      color: "var(--danger)", fontSize: 13, display: "flex", gap: 8
                    }}
                  >
                    <XCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </motion.div>
                )}

                <motion.button
                  className="btn-primary"
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ height: 50, fontSize: 15 }}
                  id="pay-send-btn"
                >
                  {loading
                    ? <><Loader2 size={16} className="spin-slow" /> Analyzing with AI…</>
                    : <><Send size={16} /> Send ₹{amount || "0"} <ArrowRight size={14} /></>
                  }
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* ── Right: Result */}
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {(() => {
                  const cfg = STATUS_CONFIG[result.status] ?? STATUS_CONFIG.BLOCKED;
                  const Icon = cfg.icon;
                  const isPending = result.status === "PENDING_TELEGRAM";

                  return (
                    <div
                      className="glass-card"
                      style={{ padding: 28, boxShadow: `var(--shadow-md), ${cfg.glow}` }}
                    >
                      {/* Status banner */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          padding: "18px 20px", borderRadius: 14, marginBottom: 24,
                          background: cfg.bg, border: `1px solid ${cfg.border}`,
                          display: "flex", alignItems: "center", gap: 14,
                          boxShadow: cfg.glow
                        }}
                      >
                        <Icon size={30} color={cfg.color} />
                        <div>
                          <p style={{ fontSize: 17, fontWeight: 800, color: cfg.color }}>
                            {cfg.label}
                          </p>
                          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
                            {result.message}
                          </p>
                        </div>
                      </motion.div>

                      {/* Telegram waiting UI */}
                      {isPending && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="telegram-box"
                          style={{ marginBottom: 24 }}
                        >
                          <div style={{ fontSize: 40, marginBottom: 12 }}>✈️</div>
                          <p style={{ fontWeight: 700, fontSize: 16, color: "#e8f0ff", marginBottom: 8 }}>
                            Check Your Telegram
                          </p>
                          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>
                            We sent an authorization request for
                            <strong style={{ color: "#fff" }}> ₹{result.amount.toLocaleString()}</strong>
                          </p>

                          {/* Animated dots */}
                          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                            {["dot-1", "dot-2", "dot-3"].map((cls) => (
                              <div
                                key={cls}
                                className={cls}
                                style={{
                                  width: 10, height: 10, borderRadius: "50%",
                                  background: "#2596d2"
                                }}
                              />
                            ))}
                          </div>

                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                            Polling for response… ({pollCount} checks)
                          </p>

                          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "center" }}>
                            <div style={{ textAlign: "center" }}>
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "6px 14px", borderRadius: 99,
                                background: "rgba(0,232,135,0.15)", border: "1px solid rgba(0,232,135,0.3)",
                                fontSize: 12, fontWeight: 700, color: "var(--success)"
                              }}>
                                ✅ Accept in Telegram
                              </span>
                            </div>
                            <div>
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "6px 14px", borderRadius: 99,
                                background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)",
                                fontSize: 12, fontWeight: 700, color: "var(--danger)"
                              }}>
                                ❌ Decline in Telegram
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Risk meter (hide while pending to give telegram UI more space) */}
                      {!isPending && (
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                          <RiskMeter value={result.overall_risk} size={150} label="AI Risk Score" />
                        </div>
                      )}

                      {/* Transaction details grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                        {[
                          { label: "Amount",    value: `₹${result.amount.toLocaleString()}` },
                          { label: "Recipient", value: result.recipient_name || result.recipient_id },
                          { label: "Status",    value: result.status },
                          ...(result.new_balance !== undefined
                            ? [{ label: "New Balance", value: `₹${result.new_balance.toLocaleString()}` }]
                            : []),
                        ].map(({ label, value }) => (
                          <div
                            key={label}
                            style={{
                              padding: "12px 14px", borderRadius: 10,
                              background: "rgba(255,255,255,0.025)", border: "1px solid var(--border-color)"
                            }}
                          >
                            <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {label}
                            </p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <p style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "JetBrains Mono, monospace" }}>
                        TX: {result.tx_id}
                      </p>

                      {/* Risk factors */}
                      {result.risk_factors?.length > 0 && !isPending && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            marginTop: 16, padding: "14px 16px", borderRadius: 12,
                            background: "rgba(255,77,109,0.05)", border: "1px solid rgba(255,77,109,0.2)"
                          }}
                        >
                          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Risk Factors Detected
                          </p>
                          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                            {result.risk_factors.map((f, i) => (
                              <li key={i} style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 8 }}>
                                <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 2, color: "var(--warning)" }} />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </div>
                  );
                })()}

                <motion.button
                  className="btn-ghost"
                  onClick={() => { setResult(null); setPollCount(0); }}
                  whileHover={{ scale: 1.01 }}
                  style={{ width: "100%", height: 44 }}
                >
                  Make Another Payment
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card"
                style={{ padding: 56, textAlign: "center" }}
              >
                <div style={{
                  width: 80, height: 80, borderRadius: 20, margin: "0 auto 20px",
                  background: "linear-gradient(135deg, rgba(255,179,71,0.15), rgba(255,77,109,0.08))",
                  border: "1px solid rgba(255,179,71,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <CreditCard size={36} style={{ color: "var(--warning)", opacity: 0.7 }} />
                </div>
                <p style={{ fontSize: 15, color: "var(--text-secondary)", fontWeight: 500, marginBottom: 8 }}>
                  AI risk analysis results appear here
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  Try <strong style={{ color: "var(--danger)" }}>KBC Lottery Support</strong> to see<br />
                  a payment blocked by AI in real time
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                  <span className="badge badge-danger">BLOCKED</span>
                  <span className="badge badge-warning">FLAGGED</span>
                  <span className="badge badge-success">APPROVED</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
