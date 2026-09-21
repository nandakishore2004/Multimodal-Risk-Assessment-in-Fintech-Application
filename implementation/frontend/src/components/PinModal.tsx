"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, Delete, ShieldCheck } from "lucide-react";

interface PinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  /** The correct PIN — default "123456" for demo */
  correctPin?: string;
  /** If true, user cannot close modal without entering PIN */
  required?: boolean;
}

const DEMO_PIN = "1234";

export default function PinModal({
  isOpen,
  onSuccess,
  onClose,
  title = "Enter UPI PIN",
  subtitle = "Authenticate to continue",
  correctPin = DEMO_PIN,
  required = false,
}: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const maxLen = correctPin.length;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      setSuccess(false);
      setShake(false);
    }
  }, [isOpen]);

  // Auto-verify when PIN is full length
  useEffect(() => {
    if (pin.length === maxLen) {
      if (pin === correctPin) {
        setSuccess(true);
        setError("");
        setTimeout(() => {
          onSuccess();
          setPin("");
          setSuccess(false);
        }, 600);
      } else {
        setShake(true);
        setError("Wrong PIN. Try again.");
        setTimeout(() => {
          setPin("");
          setShake(false);
        }, 700);
      }
    }
  }, [pin, correctPin, maxLen, onSuccess]);

  const handleDigit = (d: string) => {
    if (pin.length < maxLen && !success) {
      setError("");
      setPin((p) => p + d);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const DIGITS = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "⌫"],
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="pin-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={required ? undefined : onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
      >
        <motion.div
          key="pin-card"
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={shake
            ? { opacity: 1, scale: 1, y: 0, x: [0, -12, 12, -10, 10, -6, 6, 0] }
            : { opacity: 1, scale: 1, y: 0, x: 0 }
          }
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 340,
            background: "linear-gradient(145deg, rgba(15,18,35,0.98), rgba(10,12,25,0.98))",
            border: success
              ? "1.5px solid rgba(0,232,135,0.6)"
              : "1.5px solid rgba(79,143,255,0.25)",
            borderRadius: 24,
            boxShadow: success
              ? "0 0 60px rgba(0,232,135,0.25), 0 24px 64px rgba(0,0,0,0.6)"
              : "0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(79,143,255,0.08)",
            padding: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow top */}
          <div style={{
            position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
            width: 200, height: 120,
            background: success
              ? "radial-gradient(ellipse, rgba(0,232,135,0.18) 0%, transparent 70%)"
              : "radial-gradient(ellipse, rgba(79,143,255,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Close btn */}
          {!required && onClose && (
            <button
              onClick={onClose}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.5)",
              }}
            >
              <X size={14} />
            </button>
          )}

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <motion.div
              animate={success ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
              style={{
                width: 56, height: 56, borderRadius: 16,
                background: success
                  ? "linear-gradient(135deg, rgba(0,232,135,0.25), rgba(0,180,105,0.15))"
                  : "linear-gradient(135deg, rgba(79,143,255,0.2), rgba(120,80,255,0.15))",
                border: success
                  ? "1.5px solid rgba(0,232,135,0.4)"
                  : "1.5px solid rgba(79,143,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              {success
                ? <ShieldCheck size={26} color="#00e887" />
                : <Lock size={24} color="rgba(79,143,255,0.9)" />
              }
            </motion.div>

            <p style={{ fontSize: 17, fontWeight: 700, color: "#f0f4ff", marginBottom: 4 }}>
              {success ? "Verified! ✓" : title}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              {success ? "Authentication successful" : subtitle}
            </p>

            {/* Demo hint */}
            {!success && (
              <div style={{
                marginTop: 10, padding: "5px 12px", borderRadius: 99,
                background: "rgba(255,179,71,0.08)",
                border: "1px solid rgba(255,179,71,0.2)",
                display: "inline-block",
              }}>
                <span style={{ fontSize: 11, color: "rgba(255,179,71,0.8)" }}>
                  Demo PIN: {correctPin}
                </span>
              </div>
            )}
          </div>

          {/* PIN dots */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 12, marginBottom: 28,
          }}>
            {Array.from({ length: maxLen }).map((_, i) => (
              <motion.div
                key={i}
                animate={pin.length === i + 1 ? { scale: [1.3, 1] } : {}}
                transition={{ duration: 0.18 }}
                style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: success
                    ? "#00e887"
                    : i < pin.length
                    ? "#4f8fff"
                    : "rgba(255,255,255,0.1)",
                  border: i < pin.length
                    ? success ? "none" : "2px solid rgba(79,143,255,0.7)"
                    : "2px solid rgba(255,255,255,0.15)",
                  transition: "all 0.2s",
                  boxShadow: i < pin.length
                    ? success
                      ? "0 0 10px rgba(0,232,135,0.6)"
                      : "0 0 10px rgba(79,143,255,0.5)"
                    : "none",
                }}
              />
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  textAlign: "center", fontSize: 12, color: "#ff4d6d",
                  marginBottom: 16, fontWeight: 600,
                }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Numpad */}
          {!success && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DIGITS.map((row, ri) => (
                <div key={ri} style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  {row.map((d, di) => {
                    if (d === "") return <div key={di} style={{ width: 80, height: 56 }} />;
                    const isDelete = d === "⌫";
                    return (
                      <motion.button
                        key={di}
                        whileHover={{ scale: 1.06, background: "rgba(79,143,255,0.18)" }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => isDelete ? handleDelete() : handleDigit(d)}
                        style={{
                          width: 80, height: 56, borderRadius: 14,
                          background: isDelete
                            ? "rgba(255,77,109,0.08)"
                            : "rgba(255,255,255,0.05)",
                          border: isDelete
                            ? "1px solid rgba(255,77,109,0.2)"
                            : "1px solid rgba(255,255,255,0.08)",
                          color: isDelete ? "#ff4d6d" : "#e8f0ff",
                          fontSize: isDelete ? 20 : 22,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "background 0.15s",
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        {isDelete ? <Delete size={18} color="#ff4d6d" /> : d}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <p style={{
            textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)",
            marginTop: 20, letterSpacing: "0.05em",
          }}>
            🔒 SECURED BY AI FRAUD SHIELD
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
