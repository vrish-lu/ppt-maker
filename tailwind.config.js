/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gamma-blue': '#3a3aff',
        'gamma-violet': '#7c3aed',
        'gamma-cyan': '#06b6d4',
        'gamma-teal': '#14b8a6',
        'gamma-bg': '#f5f7fa',
        'gamma-dark': '#18181b',
        'gamma-gray': '#64748b',
        'gamma-accent': '#f59e42',
      },
    },
  },
  plugins: [],
} 