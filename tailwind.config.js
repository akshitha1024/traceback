/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "#c9c3c3",
        panel: "#efefef",
        surface: "#ffffff",
        ink: "#1e1e1e",
        border: "#b9b7b7",
        lost: "#E57373",
        found: "#77CE8E",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl2: "16px",
      },
    },
  },
  plugins: [],
};
