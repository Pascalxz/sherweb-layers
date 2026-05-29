// layerData.ts — données de présentation pour le design « Sherweb Layer »
// (modules de la viz, moteurs, types d'output, gouvernance, tone). Client-safe.
// Port de la maquette Claude Design (app/data.jsx).

import type { Engine, OutputType } from "@/lib/types";

export interface EngineMeta {
  id: Engine | "copilot" | "gemini" | "mistral";
  label: string;
  sub: string;
  state: "active" | "selectable" | "configured";
  brand: string;
  glyph: string;
}

export const ENGINES: EngineMeta[] = [
  { id: "claude", label: "Claude", sub: "claude-sonnet-4-6", state: "active", brand: "#D97757", glyph: "C" },
  { id: "openai", label: "OpenAI", sub: "gpt-4o", state: "selectable", brand: "#10A37F", glyph: "O" },
  { id: "copilot", label: "Copilot", sub: "Microsoft 365", state: "configured", brand: "#0061AA", glyph: "M" },
  { id: "gemini", label: "Gemini", sub: "Google", state: "configured", brand: "#4285F4", glyph: "G" },
  { id: "mistral", label: "Mistral", sub: "Le Chat", state: "configured", brand: "#F2A73B", glyph: "M" },
];

export interface OutputTypeMeta {
  id: OutputType | "script" | "tool";
  fr: string;
  icon: string;
  state: "active" | "soon";
}

export const OUTPUT_TYPES: OutputTypeMeta[] = [
  { id: "landing_page", fr: "Landing page", icon: "fa-window-maximize", state: "active" },
  { id: "email", fr: "Email", icon: "fa-envelope", state: "active" },
  { id: "brief", fr: "Brief", icon: "fa-file-lines", state: "active" },
  { id: "script", fr: "Script", icon: "fa-film", state: "soon" },
  { id: "tool", fr: "Outil interactif", icon: "fa-toolbox", state: "soon" },
];

export interface ModuleMeta {
  id: string;
  label: string;
  sub: string;
  icon: string;
  live?: boolean;
}

// Les 8 modules de contexte de la couche.
export const MODULES: ModuleMeta[] = [
  { id: "design_system", label: "Design system", sub: "Tokens · couleurs · typo", icon: "fa-palette" },
  { id: "brand_assets", label: "Brand assets", sub: "Logos · imagerie", icon: "fa-images" },
  { id: "tone_of_voice", label: "Tone of voice", sub: "EN / FR", icon: "fa-comment-dots", live: true },
  { id: "approved", label: "Contenu approuvé", sub: "Copies validées", icon: "fa-circle-check", live: true },
  { id: "product", label: "Connaissance produit", sub: "M365 · Azure · Acronis", icon: "fa-cube" },
  { id: "examples", label: "Meilleurs exemples", sub: "Artefacts gagnants", icon: "fa-trophy" },
  { id: "workflows", label: "Skills & workflows", sub: "Recettes réutilisables", icon: "fa-sitemap" },
  { id: "governance", label: "Gouvernance", sub: "Règles non négociables", icon: "fa-scale-balanced", live: true },
];

export const TONE: Record<"fr" | "en", string> = {
  fr: "Voix : professionnelle, neutre, confiante, solidaire. Vouvoiement (« vous » = le MSP, « nous » = Sherweb). Casse phrase, pas de Title Case. CTA = verbe + nom (« Obtenir le guide »). Bénéfice d'abord, jamais de mots creux (innovant, synergie). Pas d'emoji.",
  en: "Voice: professional, neutral, confident, supportive. Second person (“you” = the MSP, “we” = Sherweb). Sentence case, never Title Case. CTAs are verb + noun (“Get the guide”). Benefit-first, no filler words. No emoji.",
};

export interface GovRuleMeta {
  id: string;
  cat: "compliance" | "legal" | "brand";
  rule: string;
}

export const GOVERNANCE: GovRuleMeta[] = [
  { id: "g1", cat: "compliance", rule: "Mentionner que les données sont hébergées au Canada (conformité Loi 25) lorsque pertinent." },
  { id: "g2", cat: "legal", rule: "Ne jamais promettre de rabais chiffré ou de SLA sans approbation des ventes." },
  { id: "g3", cat: "brand", rule: "Le rouge (#DB4227) est strictement réservé aux appels à l'action." },
  { id: "g4", cat: "brand", rule: "Nommer les produits exactement : Microsoft 365, Azure, Acronis, Bitdefender, Cloud PBX." },
  { id: "g5", cat: "brand", rule: "Typographie Montserrat uniquement. Iconographie Font Awesome, jamais d'emoji." },
  { id: "g6", cat: "compliance", rule: "Toute génération IA passe par la couche : aucun appel « nu » à un modèle." },
];

export const outputMeta = (id: string): OutputTypeMeta | undefined =>
  OUTPUT_TYPES.find((t) => t.id === id);
export const engineMeta = (id: string): EngineMeta | undefined =>
  ENGINES.find((e) => e.id === id);
