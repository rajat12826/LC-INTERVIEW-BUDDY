"use client";
import { useLocalStorage } from '@/utils/useLocalStorage';
import React, { useEffect } from 'react';

interface SwitchDarkModeToggleProps {
  className?: string;
}

const SwitchDarkModeToggle: React.FC<SwitchDarkModeToggleProps> = ({ 
  className = "" 
}) => {
  const [toggle, setToggle, mounted] = useLocalStorage("theme", false);
  const isDark = toggle === "dark" || toggle === true;

  useEffect(() => {
    if (!mounted) return;

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark, mounted]);

  const handleToggle = () => {
    setToggle(isDark ? "light" : "dark");
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`w-12 h-6 bg-gray-200 rounded-full ${className}`} />
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`
        relative inline-flex items-center
        w-12 h-6 rounded-full transition-colors duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isDark 
          ? 'bg-blue-600 hover:bg-blue-700' 
          : 'bg-gray-300 hover:bg-gray-400'
        }
        ${className}
      `}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      type="button"
    >
      {/* Switch Handle */}
      <div
        className={`
          absolute top-0.5 left-0.5 w-5 h-5 rounded-full
          bg-white shadow-md transition-transform duration-300 ease-in-out
          flex items-center justify-center
          ${isDark ? 'transform translate-x-6' : 'transform translate-x-0'}
        `}
      >
        {/* Mini Icon inside handle */}
        {isDark ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-blue-600"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-yellow-500"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 6.34L4.93 4.93M19.07 19.07l-1.41-1.41" />
          </svg>
        )}
      </div>
    </button>
  );
};

export default SwitchDarkModeToggle;