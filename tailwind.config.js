/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define your custom CSS variables for colors
        // These will be set in index.css for different themes
        'primary': 'var(--color-primary)',
        'secondary': 'var(--color-secondary)',
        'accent': 'var(--color-accent)',
        'background': 'var(--color-background)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'border': 'var(--color-border)',
        'input-bg': 'var(--color-input-bg)',
        'message-bg-self': 'var(--color-message-bg-self)',
        'message-bg-other': 'var(--color-message-bg-other)',
      },
    },
  },
  plugins: [],
}

