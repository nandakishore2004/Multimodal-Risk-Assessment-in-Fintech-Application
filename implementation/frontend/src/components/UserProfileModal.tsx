"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, Phone, Mail, Briefcase, GraduationCap,
  MapPin, Calendar, CreditCard, Shield, Star, Award,
  Building2, BookOpen,
} from "lucide-react";

// ── Static profile data for SVN Kishore ──────────────────────────────────────
const PROFILE = {
  name: "SVN Kishore",
  initials: "SK",
  title: "Full-Stack AI Engineer & FinTech Developer",
  email: "svnkishore2004@gmail.com",
  phone: "+91 9121497490",
  location: "Hyderabad, Telangana, India",
  dob: "15 March 2004",
  employeeId: "FINP-EMP-2024-001",
  joinDate: "August 2024",

  current_job: {
    company: "FinPay Technologies Pvt. Ltd.",
    role: "Lead AI Risk Engineer",
    department: "AI Research & FinTech Innovation",
    type: "Full-Time",
  },

  degrees: [
    {
      degree: "B.Tech – Computer Science & Engineering (AI/ML)",
      institution: "Jawaharlal Nehru Technological University (JNTU)",
      year: "2022 – 2026",
      grade: "9.2 CGPA",
      specialization: "Artificial Intelligence & Machine Learning",
    },
    {
      degree: "Intermediate (MPC)",
      institution: "Sri Chaitanya Junior College, Hyderabad",
      year: "2020 – 2022",
      grade: "96.4%",
      specialization: "Mathematics, Physics, Chemistry",
    },
    {
      degree: "SSC (Class X)",
      institution: "St. Mary's High School, Hyderabad",
      year: "2019 – 2020",
      grade: "10 GPA",
      specialization: "",
    },
  ],

  credit_score: 820,
  account_no: "FINP-8829104",
  risk_level: "Low Risk",
};

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — light, just to dim slightly */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(2px)",
              zIndex: 9998,
            }}
          />

          {/* Right-side Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(420px, 100vw)",
              zIndex: 9999,
              overflowY: "auto",
              background: "var(--bg-glass, #0d1b2e)",
              borderLeft: "1px solid rgba(245,166,35,0.25)",
              boxShadow: "-16px 0 60px rgba(0,0,0,0.55)",
              scrollbarWidth: "thin",
            }}
          >
            {/* Gold left stripe */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: 3,
                background: "linear-gradient(180deg, #f5a623, #0fbcb0, #f5a623)",
              }}
            />

            {/* Header */}
            <div
              style={{
                padding: "28px 28px 20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                {/* Avatar */}
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #d97706, #fbbf24)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 900,
                    color: "#08111e",
                    flexShrink: 0,
                    boxShadow: "0 8px 24px rgba(245,166,35,0.45)",
                    border: "3px solid rgba(245,166,35,0.35)",
                  }}
                >
                  {PROFILE.initials}
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 22,
                        fontWeight: 900,
                        color: "var(--text-primary, #fff)",
                      }}
                    >
                      {PROFILE.name}
                    </h2>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: 99,
                        background: "rgba(16,185,129,0.15)",
                        color: "#10b981",
                        border: "1px solid rgba(16,185,129,0.3)",
                      }}
                    >
                      ● Active
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 13,
                      color: "#0fbcb0",
                      fontWeight: 600,
                    }}
                  >
                    {PROFILE.title}
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 12,
                      color: "var(--text-muted, #8899aa)",
                    }}
                  >
                    ID: {PROFILE.employeeId} · Joined {PROFILE.joinDate}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted, #8899aa)",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                padding: "0 28px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              {/* Contact */}
              <Section title="Contact Information" icon={<User size={15} />}>
                <InfoGrid>
                  <InfoItem icon={<Mail size={14} />} label="Email" value={PROFILE.email} />
                  <InfoItem icon={<Phone size={14} />} label="Phone" value={PROFILE.phone} />
                  <InfoItem icon={<MapPin size={14} />} label="Location" value={PROFILE.location} />
                  <InfoItem icon={<Calendar size={14} />} label="Date of Birth" value={PROFILE.dob} />
                </InfoGrid>
              </Section>

              {/* Current Job */}
              <Section title="Current Employment" icon={<Briefcase size={15} />}>
                <div
                  style={{
                    background: "rgba(245,166,35,0.06)",
                    border: "1px solid rgba(245,166,35,0.2)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 16,
                  }}
                >
                  <InfoItem icon={<Building2 size={14} />} label="Company" value={PROFILE.current_job.company} />
                  <InfoItem icon={<Briefcase size={14} />} label="Role" value={PROFILE.current_job.role} />
                  <InfoItem icon={<Star size={14} />} label="Department" value={PROFILE.current_job.department} />
                  <InfoItem icon={<CreditCard size={14} />} label="Type" value={PROFILE.current_job.type} />
                </div>
              </Section>

              {/* Education */}
              <Section title="Educational Qualifications" icon={<GraduationCap size={15} />}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PROFILE.degrees.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      style={{
                        background: "var(--bg-secondary, rgba(255,255,255,0.04))",
                        borderRadius: 12,
                        padding: "12px 16px",
                        border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          flexShrink: 0,
                          background:
                            i === 0
                              ? "linear-gradient(135deg,rgba(245,166,35,0.2),rgba(15,188,176,0.2))"
                              : "rgba(79,143,255,0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border:
                            i === 0
                              ? "1px solid rgba(245,166,35,0.3)"
                              : "1px solid rgba(79,143,255,0.2)",
                        }}
                      >
                        <BookOpen size={16} color={i === 0 ? "#f5a623" : "#4f8fff"} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary, #fff)",
                            marginBottom: 2,
                          }}
                        >
                          {d.degree}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "#0fbcb0",
                            fontWeight: 600,
                            marginBottom: 6,
                          }}
                        >
                          {d.institution}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          <Chip color="#f5a623">{d.year}</Chip>
                          <Chip color="#10b981">{d.grade}</Chip>
                          {d.specialization && (
                            <Chip color="#4f8fff">{d.specialization}</Chip>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Section>

              {/* FinPay Account */}
              <Section title="FinPay Account Details" icon={<CreditCard size={15} />}>
                <InfoGrid>
                  <InfoItem icon={<CreditCard size={14} />} label="Account No." value={PROFILE.account_no} mono />
                  <InfoItem icon={<Star size={14} />} label="Credit Score" value={`${PROFILE.credit_score} / 900`} />
                  <InfoItem
                    icon={<Shield size={14} />}
                    label="Risk Level"
                    value={PROFILE.risk_level}
                    valueColor="#10b981"
                  />
                  <InfoItem icon={<Calendar size={14} />} label="Member Since" value={PROFILE.joinDate} />
                </InfoGrid>
              </Section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Reusable sub-components ───────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "rgba(245,166,35,0.12)",
            border: "1px solid rgba(245,166,35,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f5a623",
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "var(--text-primary, #fff)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 16,
        background: "var(--bg-secondary, rgba(255,255,255,0.04))",
        border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      {children}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  mono = false,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          color: "var(--text-muted, #8899aa)",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {icon} {label}
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: valueColor ?? "var(--text-primary, #fff)",
          fontFamily: mono ? "monospace" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Chip({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 6,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      {children}
    </span>
  );
}
