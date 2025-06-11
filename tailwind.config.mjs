const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");
/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
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
			},},
		fontFamily:{
			product: ["product","sans-serif"], 
			  
		  },
  		
  	}
  },
  plugins: [require("tailwindcss-animate")]
};
