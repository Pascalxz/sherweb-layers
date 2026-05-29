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
        // Source de vérité : design-system/colors_and_type.css (SW Brand 2025).
        sherweb: {
          primary: "#0061aa", // Blue 700 — marque, liens, CTA outline
          primaryHover: "#0a4270", // Blue 900 — hover du bleu marque
          secondary: "#0a96ed", // Blue 600 — focus / liens secondaires
          accent: "#db4227", // Red 600 — CTA principal rempli
          accentHover: "#b93624", // Red 700 — hover CTA
          heading: "#090a0c", // Ink 900 — titres
          body: "#363b43", // Ink 600 — corps de texte
          muted: "#76889a", // Slate 500 — texte secondaire
          tint: "#dff0ff", // Blue 100 — sections douces
          bgAlt: "#f4f6f7", // Slate 100 — sections alternées
          border: "#e2e7eb", // Slate 200 — hairline
          heroDark: "#0a4270", // Blue 900 — fond hero (stop clair du dégradé)
          footer: "#072a4a", // Blue 950 — pied de page / inverse
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
