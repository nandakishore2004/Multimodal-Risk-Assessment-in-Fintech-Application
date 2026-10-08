"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FileText, CreditCard,
  Wallet, LogOut, Sun, Moon, Menu, X, ChevronDown,
} from "lucide-react";
import { auth } from "@/lib/api";
import UserProfileModal from "@/components/UserProfileModal";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/loan",      icon: FileText,        label: "Loan Apply" },
  { href: "/pay",       icon: CreditCard,      label: "Pay" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Read browser state only after initial render to avoid SSR hydration mismatch
    const saved = localStorage.getItem("finpay_theme") || localStorage.getItem("neorisk_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    setUser(auth.load());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("finpay_theme", next ? "dark" : "light");
    localStorage.setItem("neorisk_theme", next ? "dark" : "light");
  };

  const logout = () => {
    auth.clear();
    router.push("/login");
  };

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--bg-glass)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border-color)",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #d97706, #fbbf24)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(245, 166, 35, 0.35)",
                fontSize: 18,
              }}
            >
              💳
            </div>
            <span
              style={{
                fontWeight: 800,
                fontSize: 19,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
              }}
            >
              Fin<span style={{ color: "#fbbf24" }}>Pay</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div
            className="desktop-nav"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    textDecoration: "none",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    background: active ? "var(--accent-glow)" : "transparent",
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                >
                  <Icon size={15} />
                  {label}
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 8,
                        background: "var(--accent-glow)",
                        zIndex: -1,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user && (
              <button
                onClick={() => setShowProfile(true)}
                title="View Profile"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 12px",
                  background: "var(--bg-secondary)",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  cursor: "pointer",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "rgba(245,166,35,0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(245,166,35,0.12)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Wallet size={14} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                  {user.name}
                </span>
                <ChevronDown size={12} style={{ color: "var(--text-muted)", marginLeft: 2 }} />
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="btn-ghost"
              style={{ padding: "8px", borderRadius: 8, minWidth: 36, height: 36 }}
              title="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={logout}
              className="btn-ghost"
              style={{ padding: "8px", borderRadius: 8, minWidth: 36, height: 36 }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
            {/* Mobile menu toggle */}
            <button
              className="btn-ghost mobile-menu-btn"
              style={{ padding: "8px", borderRadius: 8, minWidth: 36, height: 36 }}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderTop: "1px solid var(--border-color)",
              padding: "12px 0 16px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  color: pathname === href ? "var(--accent)" : "var(--text-primary)",
                  background: pathname === href ? "var(--accent-glow)" : "transparent",
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>

      {/* User Profile Modal */}
      <UserProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
}
