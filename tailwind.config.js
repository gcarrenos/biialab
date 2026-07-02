/**
 * NOTE: Tailwind v4 does not read this file (no @config directive in
 * globals.css). The brand theme lives in src/app/globals.css via @theme.
 * Kept only as documentation of the palette.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000', // Masterclass black
        accent: '#e50914', // Red accent like Masterclass
        background: {
          DEFAULT: '#0a0a0a', // Dark background
          light: '#1a1a1a', // Slightly lighter dark background
        },
        text: {
          primary: '#ffffff', // White text
          secondary: '#a0a0a0', // Gray text
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 