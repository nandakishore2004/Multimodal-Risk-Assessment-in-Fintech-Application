"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Shield,
  ArrowRight, Sun, Moon, UserCheck
} from "lucide-react";
import { api, auth } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("svnkishore2004@gmail.com");
  const [password, setPassword] = useState("123456");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.title = "FinPay — Smart & Secure Financial Platform";
    const saved = localStorage.getItem("finpay_theme") || localStorage.getItem("neorisk_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const darkSetting = saved ? saved === "dark" : prefersDark;
    setIsDark(darkSetting);
    document.documentElement.classList.toggle("dark", darkSetting);
    if (auth.load()) router.replace("/dashboard");
  }, [router]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("finpay_theme", next ? "dark" : "light");
    localStorage.setItem("neorisk_theme", next ? "dark" : "light");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail === "svnkishore2004@gmail.com" && password === "123456") {
        const userObj = { name: "SVN Kishore", email: "svnkishore2004@gmail.com", credit_score: 820 };
        try {
          const res = await api.login(trimmedEmail, password);
          auth.save(res.user);
        } catch {
          auth.save(userObj);
        }
        router.push("/dashboard");
        return;
      }
      const res = await api.login(trimmedEmail, password);
      auth.save(res.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic colors for dark & light mode (Zero purple, zero pink)
  const c = {
    pageBg: isDark ? "#070e1b" : "#f8fafc",
    leftBg: isDark ? "#0a1322" : "#ffffff",
    leftBorder: isDark ? "#16243a" : "#e2e8f0",
    cardBg: isDark ? "#0e1828" : "#f8fafc",
    cardBorder: isDark ? "#1c2b42" : "#e2e8f0",
    inputBg: isDark ? "#08111e" : "#ffffff",
    inputBorder: isDark ? "#1a283e" : "#cbd5e1",
    textPrimary: isDark ? "#f0f6ff" : "#0f172a",
    textSecondary: isDark ? "#7a97b4" : "#475569",
    textMuted: isDark ? "#5e7d9e" : "#64748b",
    rightBg: isDark
      ? "radial-gradient(ellipse at 65% 45%, #08172c 0%, #050b16 70%)"
      : "radial-gradient(ellipse at 65% 45%, #f1f5f9 0%, #e2e8f0 70%)",
    statsBg: isDark ? "rgba(10, 20, 35, 0.75)" : "rgba(255, 255, 255, 0.9)",
    statsBorder: isDark ? "#16263e" : "#cbd5e1",
    gridStroke: isDark ? "rgba(15, 188, 176, 0.03)" : "rgba(15, 188, 176, 0.08)",
  };

  return (
    <div style={{
      display: "flex",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif",
      background: c.pageBg,
      color: c.textPrimary,
      transition: "background 0.3s ease, color 0.3s ease"
    }}>

      {/* ══════════════════════════════════════════════
          LEFT PANEL: CLEAN MODERN LOGIN FORM
          ══════════════════════════════════════════════ */}
      <div style={{
        width: "44%",
        minWidth: 420,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "26px 42px",
        background: c.leftBg,
        borderRight: `1px solid ${c.leftBorder}`,
        position: "relative",
        overflowY: "auto",
        boxShadow: isDark ? "10px 0 50px rgba(0,0,0,0.5)" : "4px 0 25px rgba(0,0,0,0.06)",
        zIndex: 10,
        transition: "background 0.3s ease, border-color 0.3s ease"
      }}>

        {/* Top gold line */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "linear-gradient(90deg, transparent, #f5a623, #0fbcb0, transparent)",
        }} />
        <div style={{
          position: "absolute",
          top: -80,
          left: -80,
          width: 260,
          height: 260,
          background: "radial-gradient(circle, rgba(15, 188, 176, 0.08) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          bottom: -100,
          right: -100,
          width: 300,
          height: 300,
          background: "radial-gradient(circle, rgba(245, 166, 35, 0.06) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        {/* ── Brand Header with Theme Switcher ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #d97706, #fbbf24)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 20px rgba(245, 166, 35, 0.35)",
                flexShrink: 0
              }}>
                <span style={{ fontSize: 22 }}>💳</span>
              </div>
              <div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: isDark ? "#fbbf24" : "#d97706",
                  letterSpacing: "-0.5px",
                  lineHeight: 1.1
                }}>
                  FinPay
                </div>
                <div style={{
                  fontSize: 10,
                  color: c.textMuted,
                  fontWeight: 600,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  marginTop: 2
                }}>
                  Smart &amp; Secure Financial Platform
                </div>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              id="finpay-theme-toggle"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                color: isDark ? "#fbbf24" : "#d97706",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDark ? "Light" : "Dark"}</span>
            </button>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 18 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(15, 188, 176, 0.1)",
              border: "1px solid rgba(15, 188, 176, 0.25)",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
              color: "#0fbcb0",
              marginBottom: 10
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0fbcb0" }} />
              RBI Compliant &amp; Bank-Grade Security
            </div>
            <h1 style={{
              fontSize: 27,
              fontWeight: 800,
              lineHeight: 1.2,
              color: c.textPrimary,
              margin: 0
            }}>
              Sign In to <span style={{ color: isDark ? "#fbbf24" : "#d97706" }}>FinPay</span>
            </h1>
            <p style={{ fontSize: 13, color: c.textSecondary, marginTop: 5, marginBottom: 0 }}>
              Access your digital wallet, AI risk scoring &amp; instant transfers.
            </p>
          </div>

          {/* ── Form Card ── */}
          <div style={{
            background: c.cardBg,
            border: `1px solid ${c.cardBorder}`,
            borderRadius: 16,
            padding: "20px 18px 16px",
            position: "relative",
            transition: "background 0.3s ease, border-color 0.3s ease"
          }}>
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 13 }}>

              {/* Email field */}
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  id="fp-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder=" "
                  required
                  style={{
                    width: "100%",
                    height: 50,
                    padding: "20px 42px 6px 14px",
                    background: c.inputBg,
                    border: `1.5px solid ${emailFocused ? "#f5a623" : c.inputBorder}`,
                    borderRadius: 11,
                    color: c.textPrimary,
                    fontSize: 14,
                    outline: "none",
                    boxShadow: emailFocused ? "0 0 0 3px rgba(245, 166, 35, 0.15)" : "none",
                    transition: "border-color 0.2s, box-shadow 0.2s, background 0.3s",
                    fontFamily: "inherit"
                  }}
                />
                <label
                  htmlFor="fp-email"
                  style={{
                    position: "absolute",
                    left: 14,
                    top: emailFocused || email ? 8 : "50%",
                    transform: emailFocused || email ? "none" : "translateY(-50%)",
                    fontSize: emailFocused || email ? 10 : 13.5,
                    color: emailFocused ? "#f5a623" : c.textMuted,
                    fontWeight: emailFocused || email ? 700 : 500,
                    textTransform: emailFocused || email ? "uppercase" : "none",
                    letterSpacing: emailFocused || email ? "0.8px" : "normal",
                    transition: "all 0.2s ease",
                    pointerEvents: "none"
                  }}
                >
                  Email Address
                </label>
                <Mail
                  size={16}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: emailFocused ? "#f5a623" : c.textMuted,
                    transition: "color 0.2s"
                  }}
                />
              </div>

              {/* Password field */}
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  id="fp-pw"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  placeholder=" "
                  required
                  style={{
                    width: "100%",
                    height: 50,
                    padding: "20px 42px 6px 14px",
                    background: c.inputBg,
                    border: `1.5px solid ${pwFocused ? "#f5a623" : c.inputBorder}`,
                    borderRadius: 11,
                    color: c.textPrimary,
                    fontSize: 14,
                    outline: "none",
                    boxShadow: pwFocused ? "0 0 0 3px rgba(245, 166, 35, 0.15)" : "none",
                    transition: "border-color 0.2s, box-shadow 0.2s, background 0.3s",
                    fontFamily: "inherit"
                  }}
                />
                <label
                  htmlFor="fp-pw"
                  style={{
                    position: "absolute",
                    left: 14,
                    top: pwFocused || password ? 8 : "50%",
                    transform: pwFocused || password ? "none" : "translateY(-50%)",
                    fontSize: pwFocused || password ? 10 : 13.5,
                    color: pwFocused ? "#f5a623" : c.textMuted,
                    fontWeight: pwFocused || password ? 700 : 500,
                    textTransform: pwFocused || password ? "uppercase" : "none",
                    letterSpacing: pwFocused || password ? "0.8px" : "normal",
                    transition: "all 0.2s ease",
                    pointerEvents: "none"
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: pwFocused ? "#f5a623" : c.textMuted,
                    transition: "color 0.2s",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Remember + Forgot */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 12.5, color: c.textSecondary, userSelect: "none" }}>
                  <div
                    onClick={() => setRemember(!remember)}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `1.5px solid ${remember ? "#f5a623" : c.inputBorder}`,
                      background: remember ? "#f5a623" : c.inputBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {remember && <span style={{ fontSize: 10, fontWeight: 900, color: "#ffffff" }}>✓</span>}
                  </div>
                  Remember me
                </label>
                <a href="#" style={{ fontSize: 12.5, color: "#0fbcb0", fontWeight: 600, textDecoration: "none" }}>
                  Forgot password?
                </a>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ff4d6d",
                    fontSize: 12
                  }}
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}

              {/* Submit Button (FinPay Gold Gradient) */}
              <button
                type="submit"
                disabled={loading}
                id="login-submit-btn"
                style={{
                  width: "100%",
                  height: 46,
                  background: loading
                    ? "rgba(245, 166, 35, 0.5)"
                    : "linear-gradient(135deg, #d97706 0%, #f5a623 50%, #fbbf24 100%)",
                  border: "none",
                  borderRadius: 11,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#08111e",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 20px rgba(245, 166, 35, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s",
                  fontFamily: "inherit"
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 15,
                      height: 15,
                      border: "2px solid rgba(8, 17, 30, 0.3)",
                      borderTopColor: "#08111e",
                      borderRadius: "50%",
                      animation: "fp-spin 0.8s linear infinite"
                    }} />
                    Verifying Credentials…
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    Sign In Securely
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* ── User Account: SVN Kishore ── */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${c.cardBorder}` }}>
              <div style={{ fontSize: 10, color: c.textMuted, textAlign: "center", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600 }}>
                Account Credentials
              </div>
              <button
                type="button"
                id="quick-fill-svn"
                onClick={() => {
                  setEmail("svnkishore2004@gmail.com");
                  setPassword("123456");
                }}
                style={{
                  width: "100%",
                  background: isDark ? "rgba(245, 166, 35, 0.08)" : "rgba(245, 166, 35, 0.12)",
                  border: `1px solid ${isDark ? "rgba(245, 166, 35, 0.25)" : "rgba(245, 166, 35, 0.35)"}`,
                  borderRadius: 10,
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #d97706, #fbbf24)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#08111e",
                    fontWeight: 800,
                    fontSize: 13
                  }}>
                    SK
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: isDark ? "#fbbf24" : "#d97706" }}>
                      SVN Kishore
                    </div>
                    <div style={{ fontSize: 10.5, color: c.textMuted }}>
                      svnkishore2004@gmail.com
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#0fbcb0",
                  background: "rgba(15, 188, 176, 0.12)",
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid rgba(15, 188, 176, 0.25)"
                }}>
                  Autofill
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer Info ── */}
        <div style={{ marginTop: 14 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            padding: "7px 12px",
            background: "rgba(15, 188, 176, 0.08)",
            border: "1px solid rgba(15, 188, 176, 0.2)",
            borderRadius: 9,
            fontSize: 11,
            color: "#0fbcb0",
            fontWeight: 600
          }}>
            <Shield size={13} />
            <span>256-bit SSL · Bank-Grade Encryption · ISO 27001</span>
          </div>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: c.textMuted }}>
            New to FinPay?{" "}
            <a href="#" style={{ color: "#0fbcb0", fontWeight: 700, textDecoration: "none" }}>
              Create free account →
            </a>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL: ANIMATED SHAKING INDIAN RUPEE NOTES (₹100, ₹200, ₹500)
          ══════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        background: c.rightBg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
        transition: "background 0.3s ease"
      }}>

        {/* Subtle Background Glows (Teal & Gold - Strictly No Purple/Pink) */}
        <div style={{
          position: "absolute",
          width: 480,
          height: 480,
          background: "#0fbcb0",
          borderRadius: "50%",
          filter: "blur(110px)",
          opacity: isDark ? 0.12 : 0.08,
          top: -80,
          right: -80,
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          width: 420,
          height: 420,
          background: "#f5a623",
          borderRadius: "50%",
          filter: "blur(120px)",
          opacity: isDark ? 0.10 : 0.07,
          bottom: -60,
          left: 40,
          pointerEvents: "none"
        }} />

        {/* Subtle Grid Lines */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${c.gridStroke} 1px, transparent 1px), linear-gradient(90deg, ${c.gridStroke} 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
          pointerEvents: "none"
        }} />

        {/* ── NOTES STAGE WITH REAL IMAGES + SHAKE ANIMATION ── */}
        <div style={{
          position: "relative",
          width: 520,
          height: 430,
          zIndex: 2,
          perspective: 1200
        }}>

          {/* ₹100 Note — Real Image */}
          <div
            className="currency-note note-100"
            onMouseEnter={() => setHoveredNote(100)}
            onMouseLeave={() => setHoveredNote(null)}
            style={{
              position: "absolute", top: 10, left: 10, width: 300,
              borderRadius: 12, overflow: "hidden", cursor: "pointer",
              transformStyle: "preserve-3d", transform: "rotate(-6deg)",
              boxShadow: hoveredNote === 100
                ? "0 32px 70px rgba(0,0,0,0.7), 0 0 40px rgba(148,103,189,0.5)"
                : "0 20px 55px rgba(0,0,0,0.6), 0 0 20px rgba(148,103,189,0.2)",
              transition: "box-shadow 0.3s ease",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rupee_100.jpg" alt="100 rupee note" style={{ width: "100%", display: "block", borderRadius: 12 }} />
            {hoveredNote === 100 && <div style={{ position: "absolute", inset: 0, background: "rgba(148,103,189,0.12)", borderRadius: 12, pointerEvents: "none" }} />}
            <div style={{ position: "absolute", bottom: 8, right: 10, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.2)" }}>₹100</div>
          </div>

          {/* ₹200 Note — Real Image */}
          <div
            className="currency-note note-200"
            onMouseEnter={() => setHoveredNote(200)}
            onMouseLeave={() => setHoveredNote(null)}
            style={{
              position: "absolute", top: 155, left: 120, width: 320,
              borderRadius: 12, overflow: "hidden", cursor: "pointer",
              transformStyle: "preserve-3d", transform: "rotate(4deg)",
              boxShadow: hoveredNote === 200
                ? "0 32px 70px rgba(0,0,0,0.7), 0 0 40px rgba(251,191,36,0.55)"
                : "0 20px 55px rgba(0,0,0,0.6), 0 0 20px rgba(251,191,36,0.2)",
              transition: "box-shadow 0.3s ease",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rupee_200.jpg" alt="200 rupee note" style={{ width: "100%", display: "block", borderRadius: 12 }} />
            {hoveredNote === 200 && <div style={{ position: "absolute", inset: 0, background: "rgba(251,191,36,0.12)", borderRadius: 12, pointerEvents: "none" }} />}
            <div style={{ position: "absolute", bottom: 8, right: 10, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", color: "#fbbf24", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(251,191,36,0.35)" }}>₹200</div>
          </div>

          {/* ₹500 Note — Real Image */}
          <div
            className="currency-note note-500"
            onMouseEnter={() => setHoveredNote(500)}
            onMouseLeave={() => setHoveredNote(null)}
            style={{
              position: "absolute", top: 285, left: 55, width: 340,
              borderRadius: 12, overflow: "hidden", cursor: "pointer",
              transformStyle: "preserve-3d", transform: "rotate(-3deg)",
              boxShadow: hoveredNote === 500
                ? "0 32px 70px rgba(0,0,0,0.7), 0 0 40px rgba(15,188,176,0.5)"
                : "0 20px 55px rgba(0,0,0,0.6), 0 0 20px rgba(15,188,176,0.2)",
              transition: "box-shadow 0.3s ease",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rupee_500.jpg" alt="500 rupee note" style={{ width: "100%", display: "block", borderRadius: 12 }} />
            {hoveredNote === 500 && <div style={{ position: "absolute", inset: 0, background: "rgba(15,188,176,0.10)", borderRadius: 12, pointerEvents: "none" }} />}
            <div style={{ position: "absolute", bottom: 8, right: 10, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", color: "#0fbcb0", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(15,188,176,0.35)" }}>₹500</div>
          </div>

        </div>


        {/* ── Subtitle & Stats Below Notes ── */}
        <div style={{ textAlign: "center", zIndex: 2, marginTop: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: c.textPrimary, margin: "0 0 6px" }}>
            Smart Money, <span style={{ color: isDark ? "#fbbf24" : "#d97706" }}>Smart Future</span> 💰
          </h2>
          <p style={{ fontSize: 13, color: c.textSecondary, maxWidth: 360, margin: "0 auto", lineHeight: 1.5 }}>
            Experience real-time AI risk assessment, credit scoring &amp; lightning fast transactions.
          </p>
        </div>

        {/* Metric Badges */}
        <div style={{
          display: "flex",
          zIndex: 2,
          marginTop: 16,
          background: c.statsBg,
          border: `1px solid ${c.statsBorder}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.06)",
          transition: "background 0.3s ease, border-color 0.3s ease"
        }}>
          {[
            ["2M+", "Active Users"],
            ["₹50Cr+", "Processed"],
            ["99.9%", "Uptime SLA"]
          ].map(([val, lbl], i) => (
            <div key={lbl} style={{ padding: "10px 20px", textAlign: "center", borderLeft: i ? `1px solid ${c.statsBorder}` : "none" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: isDark ? "#fbbf24" : "#d97706" }}>{val}</div>
              <div style={{ fontSize: 9.5, color: c.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {lbl}
              </div>
            </div>
          ))}
        </div>

        {/* Security Badges */}
        <div style={{ display: "flex", gap: 8, zIndex: 2, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            "🔒 256-bit Security",
            "⚡ Instant Transfers",
            "✅ RBI Compliant"
          ].map((b) => (
            <div
              key={b}
              style={{
                background: isDark ? "rgba(245, 166, 35, 0.06)" : "rgba(245, 166, 35, 0.12)",
                border: `1px solid ${isDark ? "rgba(245, 166, 35, 0.16)" : "rgba(245, 166, 35, 0.3)"}`,
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 11,
                color: isDark ? "#94a9c4" : "#475569",
                fontWeight: 600
              }}
            >
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          CSS KEYFRAMES: DYNAMIC NOTE SHAKING / VIBRATION / FLUTTER
          ══════════════════════════════════════════════ */}
      <style>{`
        @keyframes fp-spin {
          to { transform: rotate(360deg); }
        }

        /* ₹100 Note: Dynamic shaking flutter animation */
        .note-100 {
          animation: note-shake-1 3.2s ease-in-out infinite;
        }
        @keyframes note-shake-1 {
          0%   { transform: translateY(0px) rotate(-3.5deg); }
          12%  { transform: translateY(-10px) rotate(-1.5deg) scale(1.01); }
          22%  { transform: translateY(-7px) rotate(-4.5deg); }
          34%  { transform: translateY(-16px) rotate(-2deg); }
          45%  { transform: translateY(-11px) rotate(-5deg); }
          58%  { transform: translateY(-18px) rotate(-2.5deg) scale(1.015); }
          70%  { transform: translateY(-8px) rotate(-4deg); }
          82%  { transform: translateY(-12px) rotate(-2.8deg); }
          92%  { transform: translateY(-3px) rotate(-4.2deg); }
          100% { transform: translateY(0px) rotate(-3.5deg); }
        }

        /* ₹200 Note: Vibrant rhythmic trembling & floating */
        .note-200 {
          animation: note-shake-2 3.8s ease-in-out infinite;
        }
        @keyframes note-shake-2 {
          0%   { transform: translateY(0px) rotate(3deg); }
          15%  { transform: translateY(-12px) rotate(5deg) scale(1.01); }
          28%  { transform: translateY(-6px) rotate(1.5deg); }
          42%  { transform: translateY(-19px) rotate(4.2deg) scale(1.02); }
          55%  { transform: translateY(-10px) rotate(1.8deg); }
          68%  { transform: translateY(-22px) rotate(5.5deg); }
          80%  { transform: translateY(-14px) rotate(2.2deg); }
          92%  { transform: translateY(-4px) rotate(4deg); }
          100% { transform: translateY(0px) rotate(3deg); }
        }

        /* ₹500 Note: Heavy power flutter and shake */
        .note-500 {
          animation: note-shake-3 4.4s ease-in-out infinite;
        }
        @keyframes note-shake-3 {
          0%   { transform: translateY(0px) rotate(-2deg); }
          14%  { transform: translateY(-8px) rotate(0.5deg); }
          26%  { transform: translateY(-18px) rotate(-3.5deg) scale(1.015); }
          40%  { transform: translateY(-11px) rotate(-1deg); }
          54%  { transform: translateY(-24px) rotate(-3.8deg) scale(1.02); }
          66%  { transform: translateY(-15px) rotate(0deg); }
          78%  { transform: translateY(-20px) rotate(-2.8deg); }
          88%  { transform: translateY(-7px) rotate(-1.2deg); }
          100% { transform: translateY(0px) rotate(-2deg); }
        }

        /* Rapid hover vibration / flutter */
        .currency-note:hover {
          animation: hover-flutter 0.4s ease-in-out infinite alternate !important;
          z-index: 10 !important;
        }
        @keyframes hover-flutter {
          0%   { transform: translateY(-24px) rotate(-1deg) scale(1.04); }
          50%  { transform: translateY(-26px) rotate(2deg) scale(1.05); }
          100% { transform: translateY(-22px) rotate(-2deg) scale(1.04); }
        }

        @media (max-width: 960px) {
          .currency-note { display: none !important; }
        }
      `}</style>
    </div>
  );
}
