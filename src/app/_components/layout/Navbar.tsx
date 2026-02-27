"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import {
  Menu,
  X,
  Calendar,
  User,
  Shuffle,
  Star,
  BookOpen,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import AnimatedDarkModeToggle from "./AnimatedDarkModeToggle";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/leetcode",         label: "Problems", icon: BookOpen },
  { href: "/leetcode/premium", label: "Premium",  icon: Star     },
  { href: "/leetcode/random",  label: "Random",   icon: Shuffle  },
  { href: "/leetcode/daily",   label: "Daily",    icon: Calendar },
  { href: "/leetcode/profile", label: "Profile",  icon: User     },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  /* Aceternity resizable scroll mechanic */
  const { scrollY } = useScroll();
  const [mode, setMode] = useState<"full" | "pill">("full");
  useMotionValueEvent(scrollY, "change", (cur) => {
    const prev = scrollY.getPrevious() ?? 0;
    if (cur < 60)       setMode("full");
    else if (cur > prev) setMode("pill");
    else                 setMode("full");
  });

  const isPill = mode === "pill";

  /* ── theme tokens ─────────────────────────────────────────────── */
  const bg          = dark ? "rgba(0,0,0,0.55)"        : "rgba(255,255,255,0.55)";
  const border      = dark ? "rgba(255,255,255,0.08)"  : "rgba(0,0,0,0.08)";
  const shadow      = dark
    ? "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)"
    : "0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)";

  const textPrimary  = dark ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.88)";
  const textMuted    = dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const textHover    = dark ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.75)";

  const pillBg       = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const pillBorder   = dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)";

  const shimmer      = dark
    ? "linear-gradient(90deg,transparent,rgba(99,102,241,0.4) 50%,transparent)"
    : "linear-gradient(90deg,transparent,rgba(99,102,241,0.25) 50%,transparent)";

  const divider      = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";

  /* icon chip */
  const chipActive   = dark ? "rgba(99,102,241,0.18)"  : "rgba(99,102,241,0.12)";
  const chipIconA    = dark ? "#a5b4fc"                 : "#4f46e5";
  const chipDefault  = dark ? "rgba(255,255,255,0.05)"  : "rgba(0,0,0,0.05)";
  const chipIconD    = dark ? "rgba(255,255,255,0.25)"  : "rgba(0,0,0,0.25)";

  /* dot */
  const dotColor     = dark ? "#818cf8"                 : "#4f46e5";

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">

      {/* Top shimmer line */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: shimmer }}
      />

      {/* ══════════════════════════════════════
          DESKTOP
      ══════════════════════════════════════ */}
      <motion.header
        animate={
          isPill
            ? { top: 14, width: "auto", borderRadius: 9999, paddingLeft: 18, paddingRight: 18 }
            : { top: 0,  width: "100%", borderRadius: 0,    paddingLeft: 28, paddingRight: 28 }
        }
        transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex items-center justify-between pointer-events-auto h-14"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          maxWidth: isPill ? "fit-content" : "100%",
          margin: "0 auto",
          background: bg,
          border: `1px solid ${border}`,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: shadow,
        }}
      >
        {/* Logo */}
        <AnimatePresence>
          {!isPill && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden mr-6 flex-shrink-0"
            >
              <Link href="/" className="flex items-center gap-2.5 group">
                <div
                  className="relative w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300"
                  style={{
                    boxShadow: `0 0 0 1px ${border}, 0 2px 8px rgba(99,102,241,0.12)`,
                  }}
                >
                  <Image src="/logo.webp" alt="LCPrep" width={32} height={32} priority className="object-cover" />
                </div>
                <div className="flex flex-col leading-none select-none">
                  <span className="text-[13px] font-bold tracking-tight" style={{ color: textPrimary }}>
                    LCPrep
                  </span>
                  <span className="text-[9px] font-semibold tracking-[0.15em] uppercase mt-0.5" style={{ color: textMuted }}>
                    Interview Ready
                  </span>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full select-none text-[11.5px] font-semibold tracking-[0.05em] uppercase transition-colors duration-150"
                style={{ color: isActive ? textPrimary : textMuted }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = textHover; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = textMuted;  }}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: pillBg, border: `1px solid ${pillBorder}` }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                {/* <Icon className="w-[13px] h-[13px] relative flex-shrink-0" strokeWidth={2.2} /> */}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3 ml-6">
          <div className="w-px h-4" style={{ background: divider }} />
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-7 h-7 rounded-full transition-all duration-200",
              },
            }}
          />
          <AnimatedDarkModeToggle />
        </div>
      </motion.header>

      {/* ══════════════════════════════════════
          MOBILE
      ══════════════════════════════════════ */}
      <div className="md:hidden fixed inset-x-0 top-0 px-3 pt-3 pointer-events-auto">

        {/* Mobile bar */}
        <div
          className="flex items-center justify-between px-4 rounded-2xl"
          style={{
            height: "3.25rem",
            background: bg,
            border: `1px solid ${border}`,
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: shadow,
          }}
        >
          <Link href="/" className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-xl overflow-hidden" style={{ boxShadow: `0 0 0 1px ${border}` }}>
              <Image src="/logo.webp" alt="LCPrep" width={32} height={32} className="object-cover" />
            </div>
            <span className="text-[13px] font-bold tracking-tight" style={{ color: textPrimary }}>
              LCPrep
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <UserButton appearance={{ elements: { avatarBox: "w-7 h-7 rounded-full" } }} />
            <AnimatedDarkModeToggle />
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors duration-150"
              style={{
                border: `1px solid ${border}`,
                background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                color: textMuted,
              }}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? "close" : "open"}
                  initial={{ opacity: 0, rotate: -60, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0,   scale: 1   }}
                  exit={{ opacity: 0,   rotate:  60,  scale: 0.7 }}
                  transition={{ duration: 0.14 }}
                >
                  {mobileOpen ? <X size={15} /> : <Menu size={15} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{ opacity: 0,    y: -10,  scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="mt-2 rounded-2xl overflow-hidden"
              style={{
                background: dark ? "rgba(0,0,0,0.80)" : "rgba(255,255,255,0.82)",
                border: `1px solid ${border}`,
                backdropFilter: "blur(24px) saturate(200%)",
                WebkitBackdropFilter: "blur(24px) saturate(200%)",
                boxShadow: dark
                  ? "0 20px 48px rgba(0,0,0,0.6)"
                  : "0 20px 48px rgba(0,0,0,0.12)",
              }}
            >
              {/* shimmer top line */}
              <div className="h-px" style={{ background: shimmer }} />

              <div className="p-2">
                {navigationItems.map((item, i) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0  }}
                      transition={{ delay: i * 0.05, duration: 0.18 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-semibold tracking-[0.05em] uppercase transition-all duration-150"
                        style={{
                          color: isActive ? textPrimary : textMuted,
                          background: isActive
                            ? (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)")
                            : "transparent",
                          border: `1px solid ${isActive ? border : "transparent"}`,
                        }}
                      >
                        <span
                          className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
                          style={{
                            background: isActive ? chipActive  : chipDefault,
                            color:      isActive ? chipIconA   : chipIconD,
                          }}
                        >
                          <Icon size={14} strokeWidth={2.2} />
                        </span>
                        {item.label}
                        {isActive && (
                          <span
                            className="ml-auto w-1.5 h-1.5 rounded-full"
                            style={{ background: dotColor }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}