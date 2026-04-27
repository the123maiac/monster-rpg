/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        game: ['"Press Start 2P"', 'system-ui', 'sans-serif'],
        display: ['"Fredoka"', 'system-ui', 'sans-serif'],
      },
      colors: {
        flame: '#ff6b3d',
        aqua: '#3da7ff',
        leaf: '#5fcf6e',
        stone: '#a98c6f',
        spark: '#ffd83d',
        shadow: '#6b3dff',
        light: '#fff3a3',
        wind: '#a3e8ff',
      },
      animation: {
        'pulse-slow': 'pulse 2.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
};
