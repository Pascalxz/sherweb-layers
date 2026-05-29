/**
 * htmlLibrary.ts — Librairie de composants HTML FIXES.
 *
 * Règle CLAUDE.md §6 : la couche ASSEMBLE des composants d'une librairie fixe,
 * jamais du markup libre. Le vrai défi (pièges connus) n'est pas GrapesJS mais
 * la RÉGULARITÉ du HTML : toujours les mêmes wrappers / classes / attributs.
 *
 * Chaque composant :
 *   - est encapsulé dans un wrapper `data-sw-component="<name>"` → repérable par GrapesJS (Phase 3)
 *   - n'utilise QUE les classes Tailwind listées ci-dessous (tokens Sherweb)
 *   - est documenté pour être injecté tel quel dans le system prompt
 *
 * Le rendu (preview iframe) charge Tailwind + les tokens via `renderDocument()`,
 * donc le HTML généré reste propre (classes, pas de styles inline géants).
 */

export interface ComponentSpec {
  name: string;
  description: string;
  /** Exemple canonique injecté dans le system prompt. */
  template: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Les composants fixes. Classes verrouillées = HTML éditable et régulier.
// ──────────────────────────────────────────────────────────────────────────

export const COMPONENT_LIBRARY: ComponentSpec[] = [
  {
    name: "hero",
    description:
      "Bloc d'ouverture. Fond bleu foncé (heroDark). Titre + sous-titre + double CTA. À utiliser une seule fois, en tête.",
    template: `<section data-sw-component="hero" class="bg-sherweb-heroDark text-white px-8 py-16 text-center">
  <h1 class="text-3xl md:text-4xl font-bold tracking-heading mb-4">{{TITLE}}</h1>
  <p class="text-lg text-white/85 max-w-2xl mx-auto mb-8">{{SUBTITLE}}</p>
  <div class="flex items-center justify-center gap-4 flex-wrap">
    <a href="#" data-sw-cta="primary" class="inline-flex items-center justify-center bg-sherweb-accent hover:bg-sherweb-accentHover text-white font-semibold rounded-sherweb px-5 py-3 tracking-button text-base">{{CTA_PRIMARY}}</a>
    <a href="#" data-sw-cta="secondary" class="inline-flex items-center justify-center border border-white text-white hover:bg-white/10 rounded-sherweb px-5 py-3 tracking-button text-base">{{CTA_SECONDARY}}</a>
  </div>
</section>`,
  },
  {
    name: "text-block",
    description: "Section de contenu : titre + paragraphe(s). Le bloc de base pour le corps.",
    template: `<section data-sw-component="text-block" class="px-8 py-10 max-w-3xl mx-auto">
  <h2 class="text-2xl font-bold tracking-heading text-sherweb-heading mb-3">{{HEADING}}</h2>
  <p class="text-sherweb-body leading-relaxed tracking-body">{{BODY}}</p>
</section>`,
  },
  {
    name: "product-card",
    description:
      "Carte produit/fonctionnalité : titre + description. À regrouper dans une grille (2 à 4 cartes) pour présenter piliers, features ou intégrations.",
    template: `<section data-sw-component="product-card-grid" class="px-8 py-10 max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
  <div data-sw-component="product-card" class="border border-sherweb-border rounded-sherweb p-6 bg-white">
    <h3 class="text-lg font-semibold text-sherweb-primary mb-2">{{CARD_TITLE}}</h3>
    <p class="text-sherweb-body tracking-body">{{CARD_BODY}}</p>
  </div>
</section>`,
  },
  {
    name: "proof-points",
    description:
      "Bande de preuves chiffrées. UNIQUEMENT des proof points officiels validés (voir gouvernance). Fond alterné.",
    template: `<section data-sw-component="proof-points" class="bg-sherweb-bgAlt px-8 py-12">
  <div class="max-w-4xl mx-auto grid gap-6 sm:grid-cols-3 text-center">
    <div data-sw-stat>
      <p class="text-3xl font-bold text-sherweb-primary">{{STAT_VALUE}}</p>
      <p class="text-sherweb-muted text-sm tracking-body">{{STAT_LABEL}}</p>
    </div>
  </div>
</section>`,
  },
  {
    name: "cta-block",
    description:
      "Bloc d'appel à l'action de clôture. TOUJOURS deux niveaux : CTA fort (Red 600) + CTA doux (outline). Jamais un seul CTA isolé (gouvernance).",
    template: `<section data-sw-component="cta-block" class="px-8 py-14 text-center">
  <h2 class="text-2xl font-bold tracking-heading text-sherweb-heading mb-2">{{CTA_HEADING}}</h2>
  <p class="text-sherweb-body mb-6 tracking-body">{{CTA_TAGLINE}}</p>
  <div class="flex items-center justify-center gap-4 flex-wrap">
    <a href="#" data-sw-cta="primary" class="inline-flex items-center justify-center bg-sherweb-accent hover:bg-sherweb-accentHover text-white font-semibold rounded-sherweb px-5 py-3 tracking-button text-base">{{CTA_PRIMARY}}</a>
    <a href="#" data-sw-cta="secondary" class="inline-flex items-center justify-center border border-sherweb-heading text-sherweb-heading hover:bg-sherweb-bgAlt rounded-sherweb px-5 py-3 tracking-button text-base">{{CTA_SECONDARY}}</a>
  </div>
</section>`,
  },
  {
    name: "vendor-strip",
    description:
      "Bande de logos de vendors/partenaires sur cartes claires (fond Slate 100). " +
      "Utilise UNIQUEMENT des logos existants via <img src=\"/brand/vendors/<slug>.svg\">. " +
      "Slugs disponibles : acronis, proofpoint, ironscales, keeper, nordpass, nordlayer, dropsuite, officeprotect, rewst, kalibr8, monjur, afiai. " +
      "Pour les marques sans SVG local (Microsoft 365, Azure…), écris le nom en texte dans la carte.",
    template: `<section data-sw-component="vendor-strip" class="bg-white px-8 py-12">
  <p class="text-center text-sherweb-muted text-sm tracking-button uppercase mb-6">{{VENDOR_HEADING}}</p>
  <div class="max-w-4xl mx-auto grid grid-cols-3 sm:grid-cols-4 gap-4">
    <div class="flex items-center justify-center bg-sherweb-bgAlt rounded-sherweb h-20 p-4">
      <img src="/brand/vendors/acronis.svg" alt="Acronis" class="max-h-7 max-w-full" />
    </div>
    <div class="flex items-center justify-center bg-sherweb-bgAlt rounded-sherweb h-20 p-4">
      <img src="/brand/vendors/proofpoint.svg" alt="Proofpoint" class="max-h-7 max-w-full" />
    </div>
    <div class="flex items-center justify-center bg-sherweb-bgAlt rounded-sherweb h-20 p-4">
      <img src="/brand/vendors/keeper.svg" alt="Keeper" class="max-h-7 max-w-full" />
    </div>
    <div class="flex items-center justify-center bg-sherweb-bgAlt rounded-sherweb h-20 p-4">
      <img src="/brand/vendors/nordlayer.svg" alt="NordLayer" class="max-h-7 max-w-full" />
    </div>
  </div>
</section>`,
  },
  {
    name: "footer",
    description: "Pied de page sobre. Fond Blue 950. Logo Sherweb blanc + mention discrète.",
    template: `<footer data-sw-component="footer" class="bg-sherweb-footer text-white/70 px-8 py-8 text-center text-sm tracking-body">
  <img src="/brand/Logo_Sherweb.svg" alt="Sherweb" class="h-7 mx-auto mb-3 brightness-0 invert" />
  <p>{{FOOTER_TEXT}}</p>
</footer>`,
  },
];

/** Slugs de logos vendors disponibles dans /public/brand/vendors/. */
export const VENDOR_SLUGS = [
  "acronis", "proofpoint", "ironscales", "keeper", "nordpass", "nordlayer",
  "dropsuite", "officeprotect", "rewst", "kalibr8", "monjur", "afiai",
] as const;

/** Section "librairie de composants" injectée dans le system prompt. */
export function buildComponentLibraryPrompt(): string {
  const blocks = COMPONENT_LIBRARY.map(
    (c) => `### Composant: ${c.name}\n${c.description}\n\`\`\`html\n${c.template}\n\`\`\``,
  ).join("\n\n");

  return `Tu ASSEMBLES UNIQUEMENT les composants de cette librairie fixe. \
Tu ne crées JAMAIS de balises ou de classes hors de cette liste. \
Remplace les placeholders {{...}} par du vrai contenu on-brand. \
Tu peux répéter un composant (ex. plusieurs product-card, plusieurs text-block) \
et tu peux omettre ceux qui ne servent pas, mais tu conserves exactement les wrappers, \
les classes et les attributs data-sw-* tels quels.\n\n${blocks}`;
}

/**
 * Enveloppe le HTML généré dans un document complet pour la preview iframe :
 * Tailwind (CDN) configuré avec les tokens Sherweb + Montserrat.
 * Garde le HTML généré propre (classes seulement, pas de <head> inventé).
 */
export function renderDocument(bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
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
</script>
<style>body{font-family:Montserrat,sans-serif;margin:0;color:#363b43;background:#fff}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/** Noms autorisés (utile pour une validation légère post-génération). */
export const ALLOWED_COMPONENT_NAMES = COMPONENT_LIBRARY.map((c) => c.name);
