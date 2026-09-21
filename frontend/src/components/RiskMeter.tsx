"use client";
import { motion } from "framer-motion";

interface RiskMeterProps {
  value: number;       // 0–100
  size?: number;       // px diameter
  label?: string;
  showValue?: boolean;
}

function getRiskColor(v: number) {
  if (v >= 60) return "var(--danger)";
  if (v >= 30) return "var(--warning)";
  return "var(--success)";
}

function getRiskLabel(v: number) {
  if (v >= 60) return "High Risk";
  if (v >= 30) return "Medium Risk";
  return "Low Risk";
}

export default function RiskMeter({
  value,
  size = 160,
  label,
  showValue = true,
}: RiskMeterProps) {
  const r = (size / 2) * 0.78;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  // We show a 270° arc (from 135° to 405°). strokeDashoffset controls fill.
  const arcFraction = (value / 100) * 0.75; // 75% of the circle = 270°
  const offset = circumference * (1 - arcFraction);
  const color = getRiskColor(value);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(135deg)" }}>
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={10}
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round"
          />
          {/* Animated fill */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            initial={{ strokeDashoffset: circumference * 0.75 }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
            }}
          />
        </svg>
        {/* Center text */}
        {showValue && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              style={{
                fontSize: size * 0.22,
                fontWeight: 800,
                color,
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              {value}
            </motion.span>
            <span
              style={{
                fontSize: size * 0.09,
                color: "var(--text-muted)",
                fontWeight: 500,
                marginTop: 2,
              }}
            >
              / 100
            </span>
          </div>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {getRiskLabel(value)}
        </p>
        {label && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {label}
          </p>
        )}
      </div>
    </div>
  );
}
