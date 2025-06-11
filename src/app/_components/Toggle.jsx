
"use client";
import React, { useEffect } from 'react'
import { useTheme } from "next-themes";
import { DarkModeSwitch } from 'react-toggle-dark-mode';


const ToggleButton = () => {
    const { systemTheme, theme, setTheme } = useTheme();
    // const currentTheme = theme === 'system' ? systemTheme : theme;
    const [isDarkMode, setDarkMode] = React.useState(theme=="dark"?true:false);
    useEffect(()=>{
        setDarkMode(theme=="dark"?true:false);
    })
    return (
      
        <DarkModeSwitch
        checked={isDarkMode}
        onChange={ () => theme == "dark"? setTheme('light'): setTheme("dark")}
        />
    )
}

export default ToggleButton