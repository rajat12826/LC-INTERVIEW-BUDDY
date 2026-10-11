'use client';

import { flushSync } from "react-dom";
import React, { useEffect, useRef, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export default function AnimatedDarkModeToggle({ className }: { className?: string; size?: number }) {
  const { setTheme, resolvedTheme } = useTheme();
  const switchRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    // View Transition API isn't available in every browser.
    if (!document.startViewTransition) {
      setTheme(isDark ? 'light' : 'dark');
      return;
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(isDark ? 'light' : 'dark');
      });
    });

    transition.ready.then(() => {
      const button = switchRef.current;

      if (!button) return;

      const { top, left, width, height } = button.getBoundingClientRect();

      // Start from the center of the toggle.
      const x = left + width / 2;
      const y = top + height / 2;

      const right = window.innerWidth - x;
      const bottom = window.innerHeight - y;

      const maxRadius = Math.hypot(Math.max(x, right), Math.max(y, bottom));

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <div className="relative group flex items-center justify-center">
      <button
        ref={switchRef}
        type="button"
        onClick={toggleTheme}
        className={
          className ||
          "relative flex size-10 hover:size-11 items-center justify-center rounded-xl text-black/60 dark:text-white/60 transition-all duration-200 ease-out hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white active:scale-95 cursor-pointer"
        }
      >
        {mounted ? (
          <div className="relative flex items-center justify-center size-[1.15rem]">
            <Moon
              className={`size-[1.15rem] transition-all duration-300 group-hover:scale-110 ${isDark
                ? "rotate-90 scale-0 opacity-0 pointer-events-none absolute"
                : "rotate-0 scale-100 opacity-100"
                }`}
            />
            <Sun
              className={`size-[1.15rem] transition-all duration-300 group-hover:scale-110 ${isDark
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0 pointer-events-none absolute"
                }`}
            />
          </div>
        ) : (
          <div className="size-[1.15rem]" />
        )}
        <span className="sr-only">Toggle theme</span>
      </button>
    </div>
  );
}