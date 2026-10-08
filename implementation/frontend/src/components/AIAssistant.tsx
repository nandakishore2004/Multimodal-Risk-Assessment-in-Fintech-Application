"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Bot, User, Loader2,
  Sparkles, ChevronDown, RefreshCw, Zap, Mic, MicOff, Volume2, VolumeX
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => any;

const QUICK_QUESTIONS = [
  "Naa risk score 87% ante em meaning?",
  "KYC verification ela work chestundi?",
  "Loan apply ela cheyyali?",
  "UPI fraud ela avoid cheyyali?",
  "DeBERTa model emi chestundi?",
  "Cross-Attention Fusion ante emiti?",
];

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  text: "Hey! Nenu **FinPay AI** — risk scores, fraud detection, loans, KYC anni explain chestanu!\n\n🌐 **Language choose cheyyi:**\n- **Telugu** lo adugu → Telugu lo reply\n- **English** lo ask → English lo reply\n- **Tenglish** lo matladachu → Tenglish lo reply!\n\n🎤 Mic press chesi voice lo kuda adagachu.",
  timestamp: new Date(),
};

// Auto-detect user language from their message text
function detectLang(text: string): "te" | "en" | "tenglish" {
  const teluguChars = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
  const totalChars = text.replace(/\s/g, "").length || 1;
  if (teluguChars / totalChars > 0.35) return "te";
  const tenglishWords = /\b(nenu|nee|mee|meeru|ela|emi|ante|cheppu|cheyyi|undhi|undi|ledu|kavali|ayindi|chesanu|chestanu|thelustha|matladachu|aithe|kani|kuda|lo\b|ki\b|tho\b|ga\b)\b/i;
  if (tenglishWords.test(text) && teluguChars === 0) return "tenglish";
  return "en";
}

function formatText(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function VoiceWaveform({ active }: { active: boolean }) {
  const heights = [4, 8, 12, 7, 14, 9, 5, 13, 8, 4, 11, 7];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 20 }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          animate={active ? { scaleY: [0.3, 1, 0.4, 0.9, 0.3], opacity: [0.5, 1, 0.6, 1, 0.5] } : { scaleY: 0.3, opacity: 0.3 }}
          transition={{ duration: 0.8, repeat: active ? Infinity : 0, delay: i * 0.07, ease: "easeInOut" }}
          style={{ width: 3, height: h, borderRadius: 99, background: "linear-gradient(to top, #4f8fff, #0fbcb0)", transformOrigin: "center" }}
        />
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [replyLang, setReplyLang] = useState<"auto" | "te" | "en" | "tenglish">("auto");

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [interimText, setInterimText] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  // auto-bilingual: tries te-IN first, falls back to en-IN
  const voiceLangOrderRef = useRef<string[]>(["te-IN", "en-IN"]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecCtorRef = useRef<SpeechRecognitionCtor | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const pendingSendRef = useRef<string>("");

  // Init Web Speech APIs on mount — store constructor only, create instance fresh each time
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRec: SpeechRecognitionCtor | undefined = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (SpeechRec) {
      setVoiceSupported(true);
      SpeechRecCtorRef.current = SpeechRec;
    }
    synthRef.current = window.speechSynthesis;
    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  useEffect(() => { const t = setTimeout(() => setPulse(true), 2000); return () => clearTimeout(t); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [open]);

  const speakText = useCallback((text: string) => {
    if (!ttsEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const clean = text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/<[^>]+>/g, "").replace(/\n/g, ". ");
    const utter = new SpeechSynthesisUtterance(clean);
    const voices = synthRef.current.getVoices();
    const telVoice = voices.find(v => v.lang.startsWith("te"));
    const enVoice = voices.find(v => v.lang.startsWith("en-IN") || v.lang.startsWith("en"));
    utter.voice = telVoice || enVoice || null;
    utter.lang = telVoice ? "te-IN" : "en-IN";
    utter.rate = 0.95;
    utter.pitch = 1.05;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utter);
  }, [ttsEnabled]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    recognitionRef.current?.abort();
    setIsListening(false);
    setInterimText("");
    pendingSendRef.current = "";

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.filter(m => m.id !== "welcome").slice(-8)
        .map(m => ({ role: m.role === "assistant" ? "model" : "user", text: m.text }));

      let userContext = null;
      if (typeof window !== "undefined") {
        try {
          const userStr = localStorage.getItem("finpay_user");
          const walletStr = localStorage.getItem("finpay_wallet");
          const riskStr = localStorage.getItem("finpay_latest_risk");
          if (userStr) userContext = { user: JSON.parse(userStr), wallet: walletStr ? JSON.parse(walletStr) : null, latest_risk: riskStr ? JSON.parse(riskStr) : null };
        } catch { /* ignore */ }
      }

      const finalLang = replyLang === "auto" ? detectLang(text.trim()) : replyLang;
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text.trim(), history, user_context: userContext, lang: finalLang }) });
      const data = await res.json();
      const reply = data.success ? data.reply : "Sorry, AI service is unavailable. Check if Flask server is running on port 5000.";
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", text: reply, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
      if (!open) setUnread(u => u + 1);
      speakText(reply);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: "Network error. Please check if the Flask server is running on port 5000.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, open, speakText]);

  // Auto-send after mic stops (voice mode)
  useEffect(() => {
    if (!isListening && pendingSendRef.current.trim()) {
      const text = pendingSendRef.current;
      pendingSendRef.current = "";
      const t = setTimeout(() => sendMessage(text), 350);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  // Creates a fresh recognition instance for the given lang, auto-falls back
  const startRecognition = useCallback((lang: string, isFallback = false) => {
    if (!SpeechRecCtorRef.current) return;
    recognitionRef.current?.abort();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SpeechRecCtorRef.current() as any;
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.continuous = false;

    rec.onstart = () => { setIsListening(true); setVoiceError(""); setInterimText(""); };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInterimText(interim || final);
      if (final) { pendingSendRef.current = final; setInput(final); }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      if (e.error === "language-not-supported" && !isFallback) {
        // Auto-fallback: te-IN not supported → try en-IN silently
        startRecognition("en-IN", true);
        return;
      }
      setIsListening(false);
      setInterimText("");
      if (e.error === "no-speech") setVoiceError("No speech detected — try again!");
      else if (e.error === "not-allowed") setVoiceError("Mic permission ledu. Browser settings lo allow cheyyandi.");
      else if (e.error !== "aborted") setVoiceError("Voice error: " + e.error);
    };

    rec.onend = () => { setIsListening(false); setInterimText(""); };
    recognitionRef.current = rec;
    try { rec.start(); } catch { /* already started */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMicClick = useCallback(() => {
    if (isListening) { recognitionRef.current?.stop(); return; }
    synthRef.current?.cancel();
    setIsSpeaking(false);
    setInput("");
    pendingSendRef.current = "";
    // Always start with te-IN; auto-falls back to en-IN if not supported
    startRecognition(voiceLangOrderRef.current[0]);
  }, [isListening, startRecognition]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const displayInput = interimText || input;

  return (
    <>
      {/* Floating button */}
      <motion.div
        style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999 }}
        animate={pulse && !open ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0 0 rgba(79,143,255,0.5)", "0 0 0 14px rgba(79,143,255,0)", "0 0 0 0 rgba(79,143,255,0)"] } : {}}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <motion.button
          id="ai-assistant-toggle"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
          onClick={() => setOpen(o => !o)}
          style={{
            width: 58, height: 58, borderRadius: "50%",
            background: isListening ? "linear-gradient(135deg, #ff4d6d, #ff8c42)" : "linear-gradient(135deg, #4f8fff 0%, #0fbcb0 100%)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isListening ? "0 8px 32px rgba(255,77,109,0.5)" : "0 8px 32px rgba(79,143,255,0.4), 0 2px 8px rgba(0,0,0,0.4)",
            position: "relative", transition: "background 0.3s, box-shadow 0.3s",
          }}
        >
          <AnimatePresence mode="wait">
            {open ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={22} color="#fff" /></motion.div>
              : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle size={22} color="#fff" /></motion.div>}
          </AnimatePresence>
          {unread > 0 && !open && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: "absolute", top: -4, right: -4, background: "#ff4d6d", color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg-primary)" }}>{unread}</motion.div>
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            style={{
              position: "fixed", bottom: 100, right: 28, zIndex: 9998,
              width: 390, maxWidth: "calc(100vw - 56px)", height: 600, maxHeight: "75vh",
              display: "flex", flexDirection: "column", borderRadius: 20,
              background: "var(--bg-glass)", backdropFilter: "blur(24px)",
              border: "1px solid var(--border-bright)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,143,255,0.08)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, rgba(79,143,255,0.15) 0%, rgba(15,188,176,0.10) 100%)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #4f8fff, #0fbcb0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(79,143,255,0.35)" }}>
                  <Bot size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>FinPay AI</p>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: "rgba(79,143,255,0.2)", color: "var(--accent)", letterSpacing: "0.05em" }}>AI ENGINE</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <motion.div
                      animate={{ backgroundColor: isSpeaking ? "#f59e0b" : isListening ? "#ff4d6d" : "#00e887" }}
                      style={{ width: 6, height: 6, borderRadius: "50%" }}
                    />
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>
                      {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Online · FinTech Expert"}
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {/* TTS mute toggle */}
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => { setTtsEnabled(e => !e); synthRef.current?.cancel(); setIsSpeaking(false); }}
                  title={ttsEnabled ? "Mute AI voice" : "Unmute AI voice"}
                  style={{ background: ttsEnabled ? "rgba(79,143,255,0.15)" : "transparent", border: "none", cursor: "pointer", padding: 7, borderRadius: 8, color: ttsEnabled ? "var(--accent)" : "var(--text-muted)", display: "flex", alignItems: "center" }}>
                  {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </motion.button>
                <button onClick={() => setMessages([WELCOME_MSG])} title="Clear" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "var(--text-muted)" }}><RefreshCw size={14} /></button>
                <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "var(--text-muted)" }}><ChevronDown size={16} /></button>
              </div>
            </div>

            {/* Listening banner */}
            <AnimatePresence>
              {isListening && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ padding: "10px 18px", background: "linear-gradient(135deg, rgba(255,77,109,0.12), rgba(255,140,66,0.10))", borderBottom: "1px solid rgba(255,77,109,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff4d6d", flexShrink: 0 }} />
                    <VoiceWaveform active={true} />
                    <p style={{ fontSize: 12, color: "#ff4d6d", margin: 0, fontWeight: 600, flex: 1 }}>Listening...</p>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>Telugu / English</p>
                  </div>
                  {interimText && (
                    <div style={{ padding: "6px 18px 8px", background: "rgba(255,77,109,0.05)" }}>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, fontStyle: "italic" }}>"{interimText}"</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Speaking banner */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ padding: "8px 18px", background: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(79,143,255,0.08))", borderBottom: "1px solid rgba(245,158,11,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
                    <VoiceWaveform active={true} />
                    <p style={{ fontSize: 12, color: "#f59e0b", margin: 0, fontWeight: 600 }}>AI Speaking...</p>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { synthRef.current?.cancel(); setIsSpeaking(false); }} style={{ marginLeft: "auto", fontSize: 11, padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.3)", background: "transparent", color: "#f59e0b", cursor: "pointer" }}>Stop</motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice error */}
            <AnimatePresence>
              {voiceError && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ padding: "7px 18px", background: "rgba(255,77,109,0.08)", borderBottom: "1px solid rgba(255,77,109,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 11, color: "#ff4d6d", margin: 0 }}>⚠️ {voiceError}</p>
                    <button onClick={() => setVoiceError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 12 }}>✕</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: msg.role === "assistant" ? "linear-gradient(135deg, #4f8fff, #0fbcb0)" : "linear-gradient(135deg, #fbbf24, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {msg.role === "assistant" ? <Bot size={13} color="#fff" /> : <User size={13} color="#fff" />}
                  </div>
                  <div style={{ maxWidth: "78%", padding: "10px 13px", borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px", background: msg.role === "user" ? "linear-gradient(135deg, #4f8fff, #0284c7)" : "var(--bg-card)", border: msg.role === "assistant" ? "1px solid var(--border-color)" : "none", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
                    <p style={{ fontSize: 13, lineHeight: 1.55, color: msg.role === "user" ? "#fff" : "var(--text-primary)", margin: 0, whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 4 }}>
                      {msg.role === "assistant" && ttsEnabled && (
                        <button onClick={() => speakText(msg.text)} title="Read aloud" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                          <Volume2 size={11} />
                        </button>
                      )}
                      <p style={{ fontSize: 10, color: msg.role === "user" ? "rgba(255,255,255,0.6)" : "var(--text-muted)", margin: 0 }}>
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #4f8fff, #0fbcb0)", display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={13} color="#fff" /></div>
                  <div style={{ padding: "12px 16px", borderRadius: "4px 18px 18px 18px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2].map(i => <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", opacity: 0.7 }} />)}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 2 && (
              <div style={{ padding: "6px 14px", display: "flex", flexWrap: "wrap", gap: 5, flexShrink: 0, borderTop: "1px solid var(--border-color)" }}>
                {QUICK_QUESTIONS.slice(0, 4).map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} style={{ fontSize: 10.5, padding: "5px 10px", borderRadius: 99, border: "1px solid var(--border-bright)", background: "var(--bg-glass-2)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Zap size={9} style={{ color: "var(--accent)" }} />{q}
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-color)", display: "flex", gap: 8, flexShrink: 0, background: "var(--bg-glass)", alignItems: "center" }}>
              
              {/* Language Selector */}
              <div style={{ position: "relative" }}>
                <select
                  value={replyLang}
                  onChange={(e) => setReplyLang(e.target.value as any)}
                  title="Reply Language"
                  style={{
                    appearance: "none",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-bright)",
                    borderRadius: 12,
                    padding: "10px 24px 10px 10px",
                    color: "var(--text-primary)",
                    fontSize: 12,
                    cursor: "pointer",
                    outline: "none",
                    height: 40,
                  }}
                >
                  <option value="auto">Auto 🌐</option>
                  <option value="te">Telugu అ</option>
                  <option value="en">English A</option>
                  <option value="tenglish">Tenglish 💬</option>
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: 8, top: 14, color: "var(--text-muted)", pointerEvents: "none" }} />
              </div>

              {/* Mic button */}
              {voiceSupported && (
                // Mic button — auto bilingual (te-IN → en-IN fallback)
                <motion.button
                  id="ai-mic-btn"
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={handleMicClick}
                  title={isListening ? "Stop" : "Voice input — Telugu / English (auto)"}
                  animate={isListening ? { boxShadow: ["0 0 0 0 rgba(255,77,109,0.4)", "0 0 0 9px rgba(255,77,109,0)", "0 0 0 0 rgba(255,77,109,0)"] } : {}}
                  transition={isListening ? { duration: 1.2, repeat: Infinity } : {}}
                  style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: isListening ? "linear-gradient(135deg, #ff4d6d, #ff8c42)" : "var(--bg-card)",
                    border: isListening ? "none" : "1px solid var(--border-bright)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                  }}
                >
                  {isListening ? <MicOff size={16} color="#fff" /> : <Mic size={16} color="var(--accent)" />}
                </motion.button>
              )}

              <div style={{ flex: 1, display: "flex", alignItems: "center", background: "var(--bg-card)", borderRadius: 12, border: isListening ? "1px solid rgba(255,77,109,0.5)" : "1px solid var(--border-bright)", padding: "0 12px", gap: 8, transition: "border 0.2s" }}>
                <Sparkles size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  id="ai-chat-input"
                  value={displayInput}
                  onChange={e => { if (!isListening) setInput(e.target.value); }}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Listening... matladandi 🎤" : "Ask anything about FinPay..."}
                  disabled={loading || isListening}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: isListening ? "#ff4d6d" : "var(--text-primary)", padding: "10px 0", fontStyle: isListening ? "italic" : "normal" }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading || isListening}
                id="ai-send-btn"
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: input.trim() && !loading && !isListening ? "linear-gradient(135deg, #4f8fff, #0fbcb0)" : "var(--bg-secondary)",
                  border: "none", cursor: input.trim() && !loading && !isListening ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
                }}
              >
                {loading ? <Loader2 size={16} color="var(--text-muted)" /> : <Send size={15} color={input.trim() && !isListening ? "#fff" : "var(--text-muted)"} />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
