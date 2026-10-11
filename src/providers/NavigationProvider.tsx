"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";

interface NavigationContextType {
  isNavigating: boolean;
  targetPath: string | null;
  startNavigation: (href: string) => void;
  finishNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  targetPath: null,
  startNavigation: () => {},
  finishNavigation: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Reset loading state when pathname successfully changes
  useEffect(() => {
    setIsNavigating(false);
    setTargetPath(null);
  }, [pathname]);

  const startNavigation = (href: string) => {
    // Only trigger if navigating to a different internal path
    if (!href || href === pathname || href.startsWith("#") || href.startsWith("http")) return;

    startTransition(() => {
      setTargetPath(href);
      setIsNavigating(true);
    });
  };

  const finishNavigation = () => {
    setIsNavigating(false);
    setTargetPath(null);
  };

  // Global click interceptor for standard links
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Don't intercept if modified click (new tab, etc)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;

      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Check if it's an internal route
      if (href.startsWith("/") && !href.startsWith("//") && href !== pathname) {
        startNavigation(href);
      }
    };

    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
    };
  }, [pathname]);

  // Safety fallback: auto-reset if navigation takes longer than 8 seconds
  useEffect(() => {
    if (!isNavigating) return;
    const timer = setTimeout(() => {
      setIsNavigating(false);
      setTargetPath(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [isNavigating]);

  return (
    <NavigationContext.Provider
      value={{ isNavigating, targetPath, startNavigation, finishNavigation }}
    >
      {/* Top glowing navigation progress bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none overflow-hidden bg-transparent">
          <div className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 animate-[navProgress_1.4s_ease-in-out_infinite] shadow-[0_0_12px_rgba(94,106,210,0.8)]" />
        </div>
      )}
      {children}
    </NavigationContext.Provider>
  );
}
