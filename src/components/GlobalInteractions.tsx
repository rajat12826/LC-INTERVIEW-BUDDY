"use client";

import { useGlobalClickSound } from "@/hooks/useGlobalClickSound";
import ClickSpark from "@/components/ui/click-spark";
import { useTheme } from "next-themes";

export function GlobalInteractions({ children }: { children: React.ReactNode }) {
  useGlobalClickSound();
  const { resolvedTheme } = useTheme();

  return (
    <ClickSpark 
      sparkColor={resolvedTheme === 'dark' ? '#06b6d4' : '#0ea5e9'} 
      sparkSize={10} 
      sparkRadius={15} 
      sparkCount={8} 
      duration={400}
    >
      {children}
    </ClickSpark>
  );
}
