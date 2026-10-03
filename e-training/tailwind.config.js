import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                navy: {
                    50: '#eef2ff',
                    100: '#d9e2fc',
                    200: '#b3c5f9',
                    300: '#8da8f6',
                    400: '#5a7de8',
                    500: '#3356c7',
                    600: '#1e3a8a',
                    700: '#1a3278',
                    800: '#152a66',
                    900: '#0f1f4d',
                    950: '#0a1433',
                },
                gold: {
                    50: '#fefce8',
                    100: '#fef9c3',
                    200: '#fef08a',
                    300: '#fde047',
                    400: '#facc15',
                    500: '#d4a843',
                    600: '#b8892e',
                    700: '#926c1f',
                    800: '#6d5118',
                    900: '#4a3710',
                },
                kan: {
                    bg: '#f8fafc',
                    surface: '#ffffff',
                    border: '#e2e8f0',
                },
            },
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'fade-in-up': 'fadeInUp 0.6s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
                'card-hover': '0 10px 25px -5px rgba(30, 58, 138, 0.1), 0 8px 10px -6px rgba(30, 58, 138, 0.05)',
                'nav': '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
            },
        },
    },

    plugins: [forms],
};
