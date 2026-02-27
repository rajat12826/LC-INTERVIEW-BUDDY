"use client";

import { useRef, useEffect, useCallback } from "react";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

export function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      // Reset height to 0 to get the correct scrollHeight
      textarea.style.height = "0px";
      
      const scrollHeight = textarea.scrollHeight;
      let newHeight = scrollHeight;

      // Apply constraints
      if (maxHeight && newHeight > maxHeight) {
        newHeight = maxHeight;
      }
      
      textarea.style.height = `${Math.max(newHeight, minHeight)}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    // Initial adjustment
    adjustHeight();
    
    // Optional: handle window resize
    window.addEventListener("resize", () => adjustHeight());
    return () => window.removeEventListener("resize", () => adjustHeight());
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}