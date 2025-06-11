"use client";
import { useLocalStorage } from '@/utils/useLocalStorage';
import React, { useEffect, useState } from 'react'
import { DarkModeSwitch } from 'react-toggle-dark-mode';

// Custom hook for safe localStorage access


const ToggleButton = () => {
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

    const handleToggle = (checked) => {
        setToggle(checked ? "dark" : "light");
    };

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return <div style={{ width: 24, height: 24 }} />; // Placeholder to prevent layout shift
    }

    return (
        <DarkModeSwitch
            checked={isDark}
            onChange={handleToggle}
            size={24}
        />
    );
};

export default ToggleButton;