"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import { Menu, X, Calendar, User, Shuffle, Star, BookOpen } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import AnimatedDarkModeToggle from "./AnimatedDarkModeToggle";
import { cn } from "@/lib/utils";

// ─── Nav items ────────────────────────────────────────────────────────────────

const navigationItems = [
  { href: "/leetcode",         label: "Problems", icon: BookOpen },
  { href: "/leetcode/premium", label: "Premium",  icon: Star     },
  { href: "/leetcode/random",  label: "Random",   icon: Shuffle  },
  { href: "/leetcode/daily",   label: "Daily",    icon: Calendar },
  { href: "/leetcode/profile", label: "Profile",  icon: User     },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname            = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme }   = useTheme();
  console.log(resolvedTheme);
  const [mounted, setMounted] = useState(false);

  // 1. Handle Mounting
  useEffect(() => {
    setMounted(true);
  }, []);

const dark = mounted ? resolvedTheme === "dark" : true;
  // ── Scroll-triggered pill mode ────────────────────────────────────────────
  const { scrollY } = useScroll();
  const [mode, setMode] = useState<"full" | "pill">("full");
  useMotionValueEvent(scrollY, "change", (cur) => {
    const prev = scrollY.getPrevious() ?? 0;
    if (cur < 60)        setMode("full");
    else if (cur > prev) setMode("pill");
    else                 setMode("full");
  });
  const isPill = mode === "pill";

  // ── Design tokens (matching random/daily/profile pages exactly) ──────────

  // Backgrounds
  const navBg = dark
    ? "rgba(5,5,6,0.82)"         // #050506 at 82% — matches page canvas
    : "rgba(255,255,255,0.82)";

  const navBorder = dark
    ? "rgba(255,255,255,0.06)"   // --border-default
    : "rgba(0,0,0,0.07)";

  const navShadow = dark
    // multi-layer shadow formula from design system
    ? "0 0 0 1px rgba(255,255,255,0.06), 0 4px 32px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.03) inset"
    : "0 0 0 1px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.9) inset";

  // Typography
  const textPrimary = dark ? "#EDEDEF"               : "rgba(9,9,11,0.90)";   // foreground
  const textMuted   = dark ? "#8A8F98"               : "rgba(9,9,11,0.38)";   // foreground-muted
  const textHover   = dark ? "rgba(237,237,239,0.75)": "rgba(9,9,11,0.65)";

  // Active pill
  const pillBg     = dark ? "rgba(255,255,255,0.05)"  : "rgba(0,0,0,0.05)";
  const pillBorder = dark ? "rgba(255,255,255,0.08)"  : "rgba(0,0,0,0.08)";

  // Accent shimmer — #5E6AD2
  const shimmer = dark
    ? "linear-gradient(90deg, transparent, rgba(94,106,210,0.35) 50%, transparent)"
    : "linear-gradient(90deg, transparent, rgba(94,106,210,0.18) 50%, transparent)";

  const divider = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  // Mobile icon chips
  const chipActiveBg    = dark ? "rgba(94,106,210,0.15)"  : "rgba(94,106,210,0.10)";
  const chipActiveColor = dark ? "#a5b4fc"                 : "#4f46e5";
  const chipDefaultBg   = dark ? "rgba(255,255,255,0.04)"  : "rgba(0,0,0,0.04)";
  const chipDefaultColor= dark ? "rgba(255,255,255,0.25)"  : "rgba(0,0,0,0.28)";

  // Active indicator dot — accent
  const dotColor = "#5E6AD2";

  // Mobile dropdown bg
  const dropdownBg = dark
    ? "rgba(10,10,12,0.92)"    // #0a0a0c — elevated surface
    : "rgba(255,255,255,0.94)";

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none ">

      {/* Top accent shimmer line */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: shimmer }}
      />

      {/* ════════════════════════════════════════
          DESKTOP
      ════════════════════════════════════════ */}
      <motion.header
        animate={
          isPill
            ? { top: 12, width: "auto", borderRadius: 9999, paddingLeft: 16, paddingRight: 16 }
            : { top: 0,  width: "100%", borderRadius: 0,    paddingLeft: 24, paddingRight: 24 }
        }
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex items-center justify-between pointer-events-auto h-[52px]"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          maxWidth: isPill ? "fit-content" : "100%",
          margin: "0 auto",
          background: navBg,
          border: `1px solid ${navBorder}`,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: navShadow,
        }}
      >
        {/* Logo — hidden in pill mode */}
        <AnimatePresence>
          {!isPill && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden mr-7 flex-shrink-0"
            >
              <Link href="/" className="flex items-center gap-2.5 group select-none">
                {/* Logo icon */}
                <div
                  className="relative w-[30px] h-[30px] rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200"
                  style={{
                    boxShadow: `0 0 0 1px ${navBorder}, 0 2px 8px rgba(94,106,210,0.15)`,
                  }}
                >
                  <Image
                    src="/logo.webp"
                    alt="LCPrep"
                    width={30}
                    height={30}
                    priority
                    className="object-cover"
                  />
                </div>

                {/* Wordmark */}
                <div className="flex flex-col leading-none">
                  <span
                    className="text-[13px] font-bold tracking-tight"
                    style={{ color: textPrimary }}
                  >
                    LCPrep
                  </span>
                  <span
                    className="text-[9px] font-semibold tracking-[0.16em] uppercase mt-[2px]"
                    style={{ color: textMuted }}
                  >
                    Interview Ready
                  </span>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav links */}
        <nav className="flex items-center gap-px">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center gap-1.5 px-3 py-[7px] rounded-full
                  select-none text-[11.5px] font-semibold tracking-[0.05em] uppercase
                  transition-colors duration-150 outline-none
                  focus-visible:ring-2 focus-visible:ring-[#5E6AD2]/50 focus-visible:ring-offset-0"
                style={{ color: isActive ? textPrimary : textMuted }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = textHover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = textMuted;
                }}
              >
                {/* Sliding active pill */}
                {isActive && (
                  <motion.span
                    layoutId="activeNavPill"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: pillBg,
                      border: `1px solid ${pillBorder}`,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}

                {/* Active dot */}
                {isActive && (
                  <span
                    className="relative w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: dotColor }}
                  />
                )}

                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2.5 ml-6 flex-shrink-0">
          <div
            className="w-px h-[18px]"
            style={{ background: divider }}
          />
          <UserButton
            appearance={{
              elements: {
                avatarBox:
                  "w-[26px] h-[26px] rounded-full ring-1 ring-white/10 transition-all duration-200",
              },
            }}
          />
          <AnimatedDarkModeToggle />
        </div>
      </motion.header>

      {/* ════════════════════════════════════════
          MOBILE
      ════════════════════════════════════════ */}
      <div className="md:hidden fixed inset-x-0 top-0 px-3 pt-3 pointer-events-auto">

        {/* Mobile bar */}
        <div
          className="flex items-center justify-between px-4 rounded-2xl"
          style={{
            height: "52px",
            background: navBg,
            border: `1px solid ${navBorder}`,
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: navShadow,
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 select-none">
            <div
              className="w-[30px] h-[30px] rounded-xl overflow-hidden flex-shrink-0"
              style={{ boxShadow: `0 0 0 1px ${navBorder}` }}
            >
              <Image
                src="/logo.webp"
                alt="LCPrep"
                width={30}
                height={30}
                className="object-cover"
              />
            </div>
            <span
              className="text-[13px] font-bold tracking-tight"
              style={{ color: textPrimary }}
            >
              LCPrep
            </span>
          </Link>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <UserButton
              appearance={{
                elements: { avatarBox: "w-[26px] h-[26px] rounded-full" },
              }}
            />
            <AnimatedDarkModeToggle />

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-xl
                transition-all duration-150 active:scale-[0.94]
                focus-visible:ring-2 focus-visible:ring-[#5E6AD2]/50 focus-visible:ring-offset-0"
              style={{
                border: `1px solid ${navBorder}`,
                background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                color: textMuted,
              }}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? "close" : "open"}
                  initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0,   scale: 1   }}
                  exit={{ opacity: 0,    rotate:  60,  scale: 0.6 }}
                  transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                >
                  {mobileOpen ? <X size={14} /> : <Menu size={14} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{ opacity: 0,    y: -8,  scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 rounded-2xl overflow-hidden"
              style={{
                background: dropdownBg,
                border: `1px solid ${navBorder}`,
                backdropFilter: "blur(24px) saturate(200%)",
                WebkitBackdropFilter: "blur(24px) saturate(200%)",
                boxShadow: dark
                  ? "0 0 0 1px rgba(255,255,255,0.06), 0 20px 48px rgba(0,0,0,0.65)"
                  : "0 0 0 1px rgba(0,0,0,0.04), 0 20px 40px rgba(0,0,0,0.10)",
              }}
            >
              {/* Top accent line */}
              <div className="h-px" style={{ background: shimmer }} />

              <div className="p-2 space-y-px">
                {navigationItems.map((item, i) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0  }}
                      transition={{
                        delay: i * 0.045,
                        duration: 0.18,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                          text-[12px] font-semibold tracking-[0.05em] uppercase
                          transition-all duration-150 group"
                        style={{
                          color: isActive ? textPrimary : textMuted,
                          background: isActive
                            ? dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
                            : "transparent",
                          border: `1px solid ${isActive ? navBorder : "transparent"}`,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.color = textHover;
                            (e.currentTarget as HTMLElement).style.background =
                              dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.color = textMuted;
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                          }
                        }}
                      >
                        {/* Icon chip */}
                        <span
                          className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0
                            transition-colors duration-150"
                          style={{
                            background: isActive ? chipActiveBg   : chipDefaultBg,
                            color:      isActive ? chipActiveColor : chipDefaultColor,
                            // accent border on active
                            border: isActive
                              ? `1px solid rgba(94,106,210,${dark ? "0.18" : "0.14"})`
                              : `1px solid ${navBorder}`,
                          }}
                        >
                          <Icon size={13} strokeWidth={2.2} />
                        </span>

                        {item.label}

                        {/* Active indicator */}
                        {isActive && (
                          <motion.span
                            layoutId="mobileActiveDot"
                            className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: dotColor }}
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom divider + theme hint */}
              <div
                className="mx-2 mb-2 mt-1 px-3 py-2 rounded-xl flex items-center justify-between"
                style={{
                  background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${navBorder}`,
                }}
              >
                <span
                  className="text-[10px] font-semibold tracking-[0.10em] uppercase"
                  style={{ color: textMuted }}
                >
                  LCPrep · Interview Ready
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: dotColor, opacity: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}