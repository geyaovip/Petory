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
          '0%, 100%': { transform: 'translateY(0) scaleY(1)' },
          '45%': { transform: 'translateY(-3px) scaleY(1.012)' },
          '55%': { transform: 'translateY(-3px) scaleY(1.012)' }
        },
        'pet-happy': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '18%': { transform: 'translateY(-7px) rotate(-3deg)' },
          '36%': { transform: 'translateY(0) rotate(3deg)' },
          '54%': { transform: 'translateY(-3px) rotate(-2deg)' },
          '72%': { transform: 'translateY(0) rotate(1deg)' }
        },
        'pet-focus': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(1px) scale(1.012, 0.994)' }
        },
        'pet-sleep': {
          '0%, 100%': { transform: 'translateY(1px) scale(1)', opacity: '0.72' },
          '50%': { transform: 'translateY(2px) scale(1.008, 0.992)', opacity: '0.82' }
        },
        'pet-remind': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '12%': { transform: 'translateY(-6px) rotate(-2deg)' },
          '24%': { transform: 'translateY(0) rotate(2deg)' },
          '34%': { transform: 'translateY(-2px) rotate(-1deg)' },
          '44%': { transform: 'translateY(0) rotate(0deg)' }
        },
        'pet-angry': {
          '0%, 58%, 100%': { transform: 'translateX(0) translateY(0) rotate(0deg)' },
          '62%': { transform: 'translateX(-3px) translateY(0) rotate(-1deg)' },
          '66%': { transform: 'translateX(3px) translateY(-2px) rotate(1deg)' },
          '70%': { transform: 'translateX(-2px) translateY(1px) rotate(-1deg)' },
          '74%': { transform: 'translateX(2px) translateY(-2px) rotate(1deg)' },
          '78%': { transform: 'translateX(0) translateY(2px) rotate(0deg)' },
          '82%': { transform: 'translateX(0) translateY(0) rotate(0deg)' }
        },
        'pet-pose-enter': {
          '0%': { opacity: '0', transform: 'translateY(5px) scale(0.965)', filter: 'blur(1px)' },
          '65%': { opacity: '1', transform: 'translateY(-1px) scale(1.008)', filter: 'blur(0)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' }
        },
        'pet-zzz': {
          '0%': { opacity: '0', transform: 'translate(0, 6px) scale(0.75)' },
          '25%': { opacity: '0.72' },
          '100%': { opacity: '0', transform: 'translate(10px, -24px) scale(1.08)' }
        },
        'pet-alert-pop': {
          '0%': { opacity: '0', transform: 'translateY(5px) scale(0.6)' },
          '45%': { opacity: '1', transform: 'translateY(-2px) scale(1.12)' },
          '70%': { transform: 'translateY(0) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        }
      },
      animation: {
        'pet-float': 'pet-float 3.2s ease-in-out infinite',
        'pet-happy': 'pet-happy 1.35s cubic-bezier(0.34, 1.56, 0.64, 1) infinite',
        'pet-focus': 'pet-focus 4s ease-in-out infinite',
        'pet-sleep': 'pet-sleep 4.6s ease-in-out infinite',
        'pet-remind': 'pet-remind 1.8s ease-in-out infinite',
        'pet-angry': 'pet-angry 1.65s ease-in-out infinite',
        'pet-pose-enter': 'pet-pose-enter 360ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'pet-zzz-one': 'pet-zzz 2.8s ease-out infinite',
        'pet-zzz-two': 'pet-zzz 2.8s 0.9s ease-out infinite',
        'pet-zzz-three': 'pet-zzz 2.8s 1.7s ease-out infinite',
        'pet-alert-pop': 'pet-alert-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both'
      }
    }
  },
  plugins: []
}
