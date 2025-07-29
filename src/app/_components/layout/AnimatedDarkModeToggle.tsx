// components/ToggleButton.tsx (or wherever your ToggleButton component lives)
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes'; // Import useTheme from next-themes

interface AnimatedDarkModeToggleProps {
  size?: number;
  className?: string;
}

const ToggleButton: React.FC<AnimatedDarkModeToggleProps> = ({
  size = 24,
  className = ""
}) => {
  // Use useTheme hook from next-themes
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect to ensure component is mounted before rendering UI that depends on theme
  // This helps prevent hydration mismatches, as next-themes relies on browser APIs (like localStorage)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if dark mode is currently active based on resolvedTheme
  // resolvedTheme gives the actual theme used after considering system preference
  const isDark = resolvedTheme === 'dark';

  const handleToggle = () => {
    // Set the theme based on the current dark mode state
    setTheme(isDark ? 'light' : 'dark');
  };

  // If not mounted, return a placeholder to prevent hydration errors
  // next-themes handles the initial render based on system preference
  if (!mounted) {
    return (
      <div
        style={{ width: size + 16, height: size + 16 }} // Adjust placeholder size to match button
        className={`flex items-center justify-center ${className}`}
      />
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`
        relative inline-flex items-center justify-center
        p-2 rounded-full  
        hover:bg-gray-100 dark:hover:bg-gray-800
        focus:outline-none 
        active:scale-95 group
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      type="button"
    >
      <div className="relative overflow-hidden" style={{ width: size, height: size }}>
        {/* Sun Icon */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`
            absolute inset-0 
            text-yellow-500 group-hover:text-yellow-600
            ${isDark
              ? 'transform rotate-90 scale-0 opacity-0'
              : 'transform rotate-0 scale-100 opacity-100'
            }
          `}
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>

        {/* Moon Icon */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`
            absolute inset-0 
            text-blue-400 group-hover:text-blue-300
            ${isDark
              ? 'transform rotate-0 scale-100 opacity-100'
              : 'transform -rotate-90 scale-0 opacity-0'
            }
          `}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>
    </button>
  );
};

export default ToggleButton;
