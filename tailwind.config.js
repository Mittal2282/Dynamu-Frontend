/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#833ab4",
                secondary: "#fd1d1d",
                accent: "#fcb045",
                "bg-dark": "#0f172a",
            },
        },
    },
    plugins: [],
}
