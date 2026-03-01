'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnimatedDarkModeToggleProps {
  size?: number;
  className?: string;
}

const ToggleButton: React.FC<AnimatedDarkModeToggleProps> = ({
  size = 24,
  className = ""
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <div
        style={{ width: size + 16, height: size + 16 }}
        className={`flex items-center justify-center ${className}`}
      />
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className='cursor-pointer'
    >
       <Sun className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`} />

        {/* Moon Icon */}
        <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"}`} />
         <span className="sr-only">Toggle theme</span>
      
   </Button>
  );
};

export default ToggleButton;