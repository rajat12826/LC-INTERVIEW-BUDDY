// tailwind.config.mjs

// Change require() to import for all modules
import defaultTheme from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";
import tailwindcssAnimate from "tailwindcss-animate"; // Import tailwindcss-animate using ESM syntax

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js',ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
        animation: {
            rotate: "rotate 10s linear infinite",
        },
        keyframes: {
            rotate: {
              "0%": { transform: "rotate(0deg) scale(10)" },
              "100%": { transform: "rotate(-360deg) scale(10)" },
            },
        },
        fontFamily:{
            product: ["product","sans-serif"], 
        },
    }
  },
  plugins: [tailwindcssAnimate] // Use the imported module directly here
};