"use client";
import { useLocalStorage } from '@/utils/useLocalStorage';
import React, { useEffect } from 'react';

// Custom SVG Icons
const SunIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-300 rotate-0 scale-100"
  >
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-all duration-300 rotate-0 scale-100"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

interface CustomDarkModeToggleProps {
  size?: number;
  className?: string;
}

const CustomDarkModeToggle: React.FC<CustomDarkModeToggleProps> = ({ 
  size = 24, 
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

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`flex items-center justify-center ${className}`}
      />
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`
        relative inline-flex items-center justify-center
        p-2 rounded-lg transition-all duration-200
        hover:bg-gray-100 dark:hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        active:scale-95
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      type="button"
    >
      <div className="relative">
        {isDark ? (
          <MoonIcon size={size} />
        ) : (
          <SunIcon size={size} />
        )}
      </div>
    </button>
  );
};

export default CustomDarkModeToggle;