/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',

    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        // colors: {
        //     'primary': '#3B71CA',
        //     'secondary': '#9FA6B2',
        //     'success': '#14A44D',
        //     'danger': '#DC4C64',
        //     'warning': '#E4A11B',
        //     'info': '#54B4D3',
        //     'light': '#F9FAFB',
        //     'dark': '#1F2937',
        // },
        maxWidth: {
            '1/4': '25%',
            '1/2': '50%',
            '3/4': '75%',
            '4/5': '80%',
        },
        minWidth: {
            '1/4': '25%',
            '1/2': '50%',
            '3/4': '75%',
            '4/5': '80%',
        },
        extend: {
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic':
                    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
        },
    },
    plugins: [],
}
