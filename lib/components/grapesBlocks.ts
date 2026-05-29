/**
 * grapesBlocks.ts — expose la librairie de composants fixes comme blocs GrapesJS.
 *
 * Cohérent avec CLAUDE.md §6 : dans le canvas aussi, on n'ajoute que des composants
 * de la librairie de marque. Les blocs réutilisent EXACTEMENT les templates de
 * htmlLibrary.ts (mêmes wrappers / classes / data-sw-*), placeholders remplis par
 * des valeurs on-brand par défaut issues du seed.
 */

import { COMPONENT_LIBRARY } from "@/lib/components/htmlLibrary";

// Valeurs par défaut on-brand (source : seed.ts — value prop, piliers, proof points, CTA).
const DEFAULTS: Record<string, string> = {
  TITLE: "More than a cloud distributor",
  SUBTITLE:
    "Real experts, strategic guidance, and a team that works with you to achieve your goals.",
  CTA_PRIMARY: "Get started",
  CTA_SECONDARY: "Request discovery call",
  HEADING: "A partner who puts you first",
  BODY: "We go beyond cloud distribution — a human approach that MSPs value, with the platform that powers your potential.",
  CARD_TITLE: "Simplification",
  CARD_BODY: "Manage it all in one intuitive platform.",
  STAT_VALUE: "30,000+",
  STAT_LABEL: "MSP partners",
  CTA_HEADING: "Ready for a partner who puts you first?",
  CTA_TAGLINE: "Let's talk about your growth.",
  VENDOR_HEADING: "The right cloud solutions for your MSP",
  FOOTER_TEXT: "© Sherweb — the cloud marketplace that powers your potential.",
};

function fillPlaceholders(template: string): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key: string) => DEFAULTS[key] ?? "");
}

export interface SherwebBlock {
  id: string;
  label: string;
  category: string;
  content: string;
}

/** Blocs prêts à glisser dans le canvas, un par composant de la librairie. */
export function getSherwebBlocks(): SherwebBlock[] {
  return COMPONENT_LIBRARY.map((c) => ({
    id: `sw-${c.name}`,
    label: c.name,
    category: "Composants Sherweb",
    content: fillPlaceholders(c.template),
  }));
}
