"use client";

import { useEffect } from "react";
import { useTiks } from "@rexa-developer/tiks/react";
import { tiks } from "@rexa-developer/tiks";

/**
 * Attaches a single document-level click listener that plays an audible
 * `pop()` sound from tiks whenever the user clicks any interactive element.
 *
 * Uses pop() (~80ms) instead of click() (~12ms) because click() is too
 * short to be audible at normal volumes. Volume is boosted via tiks.init().
 *
 * Mount this hook ONCE at the app root (App.tsx).
 */
export function useGlobalClickSound() {
  const { success } = useTiks();

  // Boost global volume so the sound is clearly perceptible.
  // This runs once on mount; tiks volume is shared globally.
  useEffect(() => {
    tiks.init({ volume: 0.2, theme: "soft" });
  }, []);

  useEffect(() => {
    const INTERACTIVE_SELECTORS = 
      "button, a, input, select, textarea, label, [role='button'], [role='link'], [role='tab'], [role='checkbox'], [role='radio'], [role='switch'], [role='menuitem'], [role='option'], .cursor-pointer";

    let lastPlayTime = 0;

    function handleClick(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target) return;

      // Fast check: avoid firing sound inside code editors
      if (target.closest('.monaco-editor, .monaco-mouse-cursor-text')) return;

      const interactive = target.closest(INTERACTIVE_SELECTORS);
      if (interactive) {
        const now = performance.now();
        if (now - lastPlayTime < 90) return; // throttle rapid clicks
        lastPlayTime = now;

        // Run sound asynchronously so it never blocks the main click/tab event
        setTimeout(() => {
          try {
            success();
          } catch {
            // Ignore any audio context errors
          }
        }, 0);
      }
    }

    document.addEventListener("click", handleClick, { passive: true });
    return () => document.removeEventListener("click", handleClick);
  }, [success]);
}
