import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        sherweb: {
          primary: "#0076cb",
          primaryHover: "#0061aa",
          secondary: "#0a96ed",
          accent: "#db4227",
          accentHover: "#b8351d",
          heading: "#363b43",
          body: "#434d5b",
          muted: "#5a6b80",
          bgAlt: "#f4f6f7",
          border: "#e2e7eb",
          heroDark: "#0a4270",
          footer: "#072a4a",
        },
      },
      letterSpacing: {
        heading: "-0.5px",
        body: "0.25px",
        button: "1px",
      },
      borderRadius: {
        sherweb: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
