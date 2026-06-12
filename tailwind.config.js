/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        petory: {
          primary: { DEFAULT: '#FF8A7A', hover: '#FF6B5E', soft: '#FFE8E4', light: '#FFB89E' },
          accent: { DEFAULT: '#7EC8E3', soft: '#E8F6FC', strong: '#3A8FB5' },
          bg: '#FAFAF8',
          surface: '#FFFFFF',
          muted: '#F5F4F2',
          track: '#F0EEEA',
          checker: '#EEEEEE',
          border: { DEFAULT: '#E8E6E1', strong: '#D4D1CA' },
          text: { DEFAULT: '#2D2A26', secondary: '#6B6560', tertiary: '#9C958E' },
          success: { DEFAULT: '#6BC9A8', soft: '#E8F7F0' },
          warning: { DEFAULT: '#E8A838', soft: '#FFF8E8' },
          error: { DEFAULT: '#E85D5D', soft: '#FDECEC', hover: '#FBD5D5' }
        }
      },
      boxShadow: {
        bubble: '0 2px 8px rgba(45, 42, 38, 0.12)'
      },
      keyframes: {
        'pet-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        'pet-happy': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        },
        'pet-focus': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' }
        },
        'pet-sleep': {
          '0%, 100%': { opacity: '0.6' }
        },
        'pet-remind': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        'pet-angry': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' }
        }
      },
      animation: {
        'pet-float': 'pet-float 2.5s ease-in-out infinite',
        'pet-happy': 'pet-happy 1.2s ease-in-out infinite',
        'pet-focus': 'pet-focus 2s ease-in-out infinite',
        'pet-sleep': 'pet-sleep 2.5s ease-in-out infinite',
        'pet-remind': 'pet-remind 0.8s ease-in-out infinite',
        'pet-angry': 'pet-angry 0.12s ease-in-out 6'
      }
    }
  },
  plugins: []
}
