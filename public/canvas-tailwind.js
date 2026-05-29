// canvas-tailwind.js — injecté dans l'iframe du canvas GrapesJS (après le CDN Tailwind).
// Reconfigure le Play CDN avec les tokens Sherweb pour que les classes du HTML généré
// s'affichent à l'identique dans l'éditeur (mêmes couleurs/typo que la preview).
(function () {
  window.tailwind = window.tailwind || {};
  window.tailwind.config = {
    theme: {
      extend: {
        fontFamily: { sans: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"] },
        colors: {
          sherweb: {
            primary: "#0061aa", primaryHover: "#0a4270", secondary: "#0a96ed",
            accent: "#db4227", accentHover: "#b93624", heading: "#090a0c",
            body: "#363b43", muted: "#76889a", tint: "#dff0ff", bgAlt: "#f4f6f7", border: "#e2e7eb",
            heroDark: "#0a4270", footer: "#072a4a"
          }
        },
        letterSpacing: { heading: "-0.5px", body: "0.25px", button: "1px" },
        borderRadius: { sherweb: "8px" }
      }
    }
  };
  var s = document.createElement("style");
  s.textContent = "body{font-family:Montserrat,sans-serif;margin:0;color:#363b43;background:#fff}";
  document.head.appendChild(s);
})();
