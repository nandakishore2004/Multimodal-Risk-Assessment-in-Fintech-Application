"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Square,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Volume2,
  Loader2,
  Languages,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Radio,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import RiskMeter from "@/components/RiskMeter";
import { api, type VoiceResponse } from "@/lib/api";

type RecordState = "idle" | "recording" | "recorded" | "analyzing";
type LangChoice = "te" | "en";

interface SampleScenario {
  label: string;
  lang: "Telugu" | "English";
  isScam: boolean;
  text: string;
}

const DEMO_SAMPLES: SampleScenario[] = [
  {
    label: "Telugu Scam Call",
    lang: "Telugu",
    isScam: true,
    text: "నా ఖాతా బ్లాక్ అయింది, వెంటనే ఓటీపీ చెప్పండి, అత్యవసరంగా డబ్బులు బదిలీ చేయాలి!",
  },
  {
    label: "English Scam Alert",
    lang: "English",
    isScam: true,
    text: "Urgent! My account is blocked, please share the OTP and password to transfer loan money immediately.",
  },
  {
    label: "Telugu Genuine Loan",
    lang: "Telugu",
    isScam: false,
    text: "వ్యక్తిగత అవసరాల కోసం నేను ఈ లోన్ దరఖాస్తు చేసుకుంటున్నాను, సకాలంలో చెల్లిస్తాను.",
  },
  {
    label: "English Genuine",
    lang: "English",
    isScam: false,
    text: "I confirm that this loan application is genuine for home renovation and essential family expenses.",
  },
];

export default function VoicePage() {
  const [recState, setRecState] = useState<RecordState>("idle");
  const [result, setResult] = useState<VoiceResponse | null>(null);
  const [manualText, setManualText] = useState("");
  const [error, setError] = useState("");
  const [lang, setLang] = useState<LangChoice>("te");
  const [copied, setCopied] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Check Web Speech API support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRec));
  }, []);

  const startRecording = useCallback(async () => {
    setError("");
    setResult(null);

    // 1. Start Web Speech API Recognition for LIVE real-time text
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = lang === "te" ? "te-IN" : "en-IN";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (event: any) => {
          let accumulated = "";
          for (let i = 0; i < event.results.length; i++) {
            accumulated += event.results[i][0].transcript + " ";
          }
          if (accumulated.trim()) {
            setManualText(accumulated.trim());
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onerror = (e: any) => {
          console.warn("Live speech recognition event:", e.error);
        };

        rec.start();
        recognitionRef.current = rec;
      }
    } catch (e) {
      console.warn("SpeechRecognition init error:", e);
    }

    // 2. Start MediaRecorder for Whisper AI audio capture
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        setRecState("recorded");
      };

      mr.start(250);
      mediaRef.current = mr;
      setRecState("recording");
    } catch (err) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setError(
        "Microphone access was denied or not available. Please allow mic permissions in your browser or type in the transcript box below."
      );
    }
  }, [lang]);

  const stopRecording = useCallback(() => {
    // Stop live speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    // Stop media recorder
    if (mediaRef.current && mediaRef.current.state === "recording") {
      mediaRef.current.stop();
    } else {
      setRecState("recorded");
    }
  }, []);

  const analyzeVoice = async () => {
    setRecState("analyzing");
    setError("");
    try {
      const res = await api.analyzeVoice(audioBlob, manualText.trim(), lang);
      setResult(res);
      // If backend Whisper extracted text and manualText was empty, update transcript
      if (res.final_transcript && !manualText.trim()) {
        setManualText(res.final_transcript);
      }
      setRecState("recorded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice analysis failed");
      setRecState("recorded");
    }
  };

  const reset = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (mediaRef.current && mediaRef.current.state === "recording") {
      try {
        mediaRef.current.stop();
      } catch {
        // ignore
      }
    }
    setRecState("idle");
    setResult(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setManualText("");
    setError("");
  };

  const loadScenario = (s: SampleScenario) => {
    setManualText(s.text);
    setLang(s.lang === "Telugu" ? "te" : "en");
    setResult(null);
    setError("");
    setAudioBlob(null);
    setAudioUrl(null);
    setRecState("recorded");
  };

  const copyTranscript = () => {
    if (!manualText) return;
    navigator.clipboard.writeText(manualText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const riskPct = result ? Math.round(result.fraud_prob * 100) : 0;
  const isSafe = result && result.fraud_prob <= 0.5;

  return (
    <div className="page-wrapper">
      <div className="gradient-mesh" />
      <NavBar />
      <main className="main-content" style={{ position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 className="section-title">Voice Analysis &amp; Live Speech-to-Text</h1>
              <p className="section-sub">
                Telugu &amp; English speech recognition · Whisper AI · NLP fraud-intent detection
              </p>
            </div>
            {/* Language Switcher */}
            <div
              style={{
                display: "inline-flex",
                background: "var(--bg-glass)",
                borderRadius: 12,
                padding: 4,
                border: "1px solid var(--border-color)",
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setLang("te")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: lang === "te" ? "var(--accent)" : "transparent",
                  color: lang === "te" ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.2s",
                }}
              >
                🇮🇳 తెలుగు (Telugu)
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: lang === "en" ? "var(--accent)" : "transparent",
                  color: lang === "en" ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.2s",
                }}
              >
                🌐 English
              </button>
            </div>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          {/* Left: Recording & Live Transcript Panel */}
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="glass-card" style={{ padding: 28, textAlign: "center" }}>
              {/* Animated Mic Button */}
              <div style={{ position: "relative", display: "inline-flex", marginBottom: 20 }}>
                {recState === "recording" && (
                  <>
                    <span
                      style={{
                        position: "absolute",
                        inset: -14,
                        borderRadius: "50%",
                        border: "2px solid var(--danger)",
                        opacity: 0.6,
                        animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        inset: -28,
                        borderRadius: "50%",
                        border: "1px dashed var(--danger)",
                        opacity: 0.3,
                        animation: "spin 6s linear infinite",
                      }}
                    />
                  </>
                )}

                <button
                  type="button"
                  id="voice-mic-button"
                  onClick={recState === "recording" ? stopRecording : startRecording}
                  disabled={recState === "analyzing"}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    background:
                      recState === "recording"
                        ? "linear-gradient(135deg, #ef4444, #b91c1c)"
                        : "linear-gradient(135deg, var(--accent), var(--accent-cyan))",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                      recState === "recording"
                        ? "0 0 36px rgba(239, 68, 68, 0.55)"
                        : "0 0 32px var(--accent-glow)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {recState === "recording" ? (
                    <Square size={32} color="#fff" />
                  ) : recState === "analyzing" ? (
                    <Loader2 size={32} color="#fff" className="spin-slow" />
                  ) : (
                    <Mic size={36} color="#fff" />
                  )}
                </button>
              </div>

              {/* Status Message */}
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                {recState === "idle" && "Click the Microphone to Speak"}
                {recState === "recording" && "🔴 Listening live... Speak now!"}
                {recState === "recorded" && "Voice Captured & Ready to Analyze"}
                {recState === "analyzing" && "Whisper AI Analyzing Speech..."}
              </h3>

              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                {recState === "recording"
                  ? `Language: ${lang === "te" ? "తెలుగు" : "English"} · Your words appear in the box below in real-time`
                  : `Speak in ${lang === "te" ? "Telugu (తెలుగు)" : "English"} or use demo scenarios below`}
              </p>

              {/* Live Equalizer Wave Animation while recording */}
              {recState === "recording" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 5,
                    height: 36,
                    marginBottom: 16,
                  }}
                >
                  {[30, 65, 95, 45, 80, 100, 60, 90, 40, 75, 50].map((h, i) => (
                    <span
                      key={i}
                      style={{
                        width: 4,
                        height: `${h}%`,
                        borderRadius: 99,
                        background: "var(--danger)",
                        animation: `wave 0.8s ease-in-out infinite alternate ${i * 0.08}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Big Manual STOP button — appears only while recording */}
              {recState === "recording" && (
                <button
                  type="button"
                  id="voice-stop-btn"
                  onClick={stopRecording}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    width: "100%",
                    padding: "14px 24px",
                    borderRadius: 14,
                    border: "2px solid rgba(239, 68, 68, 0.6)",
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "var(--danger)",
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: "pointer",
                    letterSpacing: 0.5,
                    marginBottom: 4,
                    transition: "all 0.2s",
                    boxShadow: "0 0 20px rgba(239, 68, 68, 0.2)",
                    animation: "pulse-red 1.5s ease-in-out infinite",
                  }}
                >
                  <Square size={20} />
                  ⏹ Mic ఆపు (Stop Recording)
                </button>
              )}

              {/* Recorded Audio Playback */}
              {audioUrl && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      fontSize: 12,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Volume2 size={14} color="var(--accent)" />
                      Recorded Speech Audio
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {((audioBlob?.size ?? 0) / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <audio controls src={audioUrl} style={{ width: "100%", height: 36 }} />
                </div>
              )}
            </div>

            {/* Live Transcript Field */}
            <div className="glass-card" style={{ padding: 22, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="input-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Speech Transcript (మీరు మాట్లాడినది ఇక్కడ కనిపిస్తుంది):</span>
                  {recState === "recording" && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 99,
                        fontSize: 10,
                        fontWeight: 700,
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "var(--danger)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--danger)",
                        }}
                      />
                      LIVE
                    </span>
                  )}
                </label>

                {manualText && (
                  <button
                    type="button"
                    onClick={copyTranscript}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              <textarea
                id="voice-transcript-textarea"
                className="input-field"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={
                  recState === "recording"
                    ? "మీరు మాట్లాడే మాటలు ఇక్కడ వెంటనే కనిపిస్తాయి... (Speaking now...)"
                    : "Speak using the microphone above, or type in Telugu / English to analyze..."
                }
                rows={4}
                style={{
                  resize: "vertical",
                  lineHeight: 1.6,
                  fontSize: 14,
                  borderColor: recState === "recording" ? "var(--accent)" : undefined,
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 6,
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                <span>{manualText.length} characters</span>
                {!speechSupported && (
                  <span style={{ color: "var(--warning)" }}>
                    ⚠️ Browser SpeechRecognition unsupported — Whisper AI will transcribe recorded audio on submit.
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button
                  type="button"
                  id="voice-analyze-btn"
                  className="btn-primary"
                  onClick={analyzeVoice}
                  disabled={
                    (!audioBlob && !manualText.trim()) ||
                    recState === "analyzing" ||
                    recState === "recording"
                  }
                  style={{ flex: 1, height: 46 }}
                >
                  {recState === "analyzing" ? (
                    <>
                      <Loader2 size={16} className="spin-slow" />
                      Analyzing Voice &amp; Fraud Risk...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Analyze Speech Risk
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-ghost"
                  onClick={reset}
                  style={{ height: 46, padding: "0 18px" }}
                >
                  <RefreshCw size={15} />
                  Reset
                </button>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "var(--danger)",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <XCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Quick Demo Voice Scenarios */}
            <div className="glass-card" style={{ padding: 20, marginTop: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                <Languages size={15} color="var(--accent)" />
                <span>Quick Test Scenarios (1-Click Fill):</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {DEMO_SAMPLES.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => loadScenario(s)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      textAlign: "left",
                      background: s.isScam ? "rgba(239, 68, 68, 0.07)" : "rgba(16, 185, 129, 0.07)",
                      border: `1px solid ${
                        s.isScam ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.25)"
                      }`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        color: s.isScam ? "var(--danger)" : "var(--success)",
                      }}
                    >
                      {s.isScam ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      &quot;{s.text}&quot;
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Results Panel */}
          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card"
                  style={{ padding: 28 }}
                >
                  {/* Verdict Badge */}
                  <div
                    style={{
                      padding: "16px 20px",
                      borderRadius: 14,
                      marginBottom: 22,
                      background: isSafe ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      border: `1px solid ${
                        isSafe ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    {isSafe ? (
                      <CheckCircle size={26} color="var(--success)" />
                    ) : (
                      <XCircle size={26} color="var(--danger)" />
                    )}
                    <div>
                      <h4
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: isSafe ? "var(--success)" : "var(--danger)",
                        }}
                      >
                        {result.prediction}
                      </h4>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                        Model: {result.model_used}
                      </p>
                    </div>
                  </div>

                  {/* Risk Meter */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
                    <RiskMeter value={riskPct} size={150} label="Speech Risk Score" />
                  </div>

                  {/* Final Transcript Display */}
                  {result.final_transcript && (
                    <div
                      style={{
                        marginBottom: 18,
                        padding: "14px 16px",
                        borderRadius: 12,
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 6,
                          fontWeight: 700,
                        }}
                      >
                        Analyzed Transcript:
                      </p>
                      <p
                        style={{
                          fontSize: 14,
                          color: "var(--text-primary)",
                          lineHeight: 1.6,
                          fontStyle: "italic",
                        }}
                      >
                        &quot;{result.final_transcript}&quot;
                      </p>
                    </div>
                  )}

                  {/* Matched Keywords Badges */}
                  {result.matched_keywords && result.matched_keywords.length > 0 ? (
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--danger)",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <AlertTriangle size={15} />
                        Flagged Suspicious Keywords Detected:
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {result.matched_keywords.map((kw, i) => (
                          <span
                            key={i}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 99,
                              fontSize: 12,
                              fontWeight: 700,
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "var(--danger)",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                            }}
                          >
                            ⚠️ {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "var(--success)",
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "rgba(16, 185, 129, 0.08)",
                      }}
                    >
                      <CheckCircle size={15} />
                      No scam or high-risk keywords detected in this declaration.
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card"
                  style={{
                    padding: 56,
                    textAlign: "center",
                    color: "var(--text-muted)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "var(--bg-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Mic size={32} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                    No Speech Analysis Yet
                  </h4>
                  <p style={{ fontSize: 13, maxWidth: 300, lineHeight: 1.5 }}>
                    Click the microphone to speak live or select a test scenario on the left to see Whisper AI and NLP risk scoring.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        @keyframes wave {
          0% { height: 20%; }
          100% { height: 100%; }
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.25); }
          50% { box-shadow: 0 0 32px rgba(239, 68, 68, 0.55), 0 0 0 6px rgba(239, 68, 68, 0.1); }
        }
      `}</style>
    </div>
  );
}
