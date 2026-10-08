"use client";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Cpu } from "lucide-react";

interface ModelCardProps {
  name: string;
  fullName: string;
  task: string;
  params: string;
  accuracy: string;
  status: "real" | "fallback" | "ready";
  sizeMb: number;
  index?: number;
}

const STATUS_CONFIG = {
  real:     { label: "Live Model", color: "var(--success)", icon: CheckCircle },
  ready:    { label: "Ready",      color: "var(--accent)",  icon: CheckCircle },
  fallback: { label: "Fallback",   color: "var(--warning)", icon: AlertTriangle },
  error:    { label: "Error",      color: "var(--danger)",  icon: XCircle },
};

export default function ModelCard({
  name,
  fullName,
  task,
  params,
  accuracy,
  status,
  sizeMb,
  index = 0,
}: ModelCardProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.fallback;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className="glass-card"
      style={{ padding: 20 }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--accent-glow), rgba(6,182,212,0.15))",
            border: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Cpu size={18} style={{ color: "var(--accent)" }} />
        </div>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 10px",
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 600,
            background: `${cfg.color}18`,
            color: cfg.color,
            border: `1px solid ${cfg.color}40`,
          }}
        >
          <Icon size={11} />
          {cfg.label}
        </span>
      </div>

      {/* Model name */}
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          marginBottom: 3,
        }}
      >
        {name}
      </h3>
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
        {fullName}
      </p>

      {/* Task */}
      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>
        {task}
      </p>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
        }}
      >
        {[
          { label: "Params", value: params },
          { label: "Accuracy", value: accuracy },
          { label: "Size", value: `${sizeMb}MB` },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: "8px",
              background: "var(--bg-secondary)",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
              {value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
