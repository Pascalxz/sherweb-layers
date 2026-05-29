import type { Engine, Lang, OutputType } from "@/lib/types";

export type GovCategory = "legal" | "brand" | "compliance";
export interface GovRule {
  id: string;
  category: GovCategory;
  rule: string;
  enabled: boolean;
}

// Génération hydratée pour l'UI workspace (issue de la DB ou d'une génération live).
export interface WSGen {
  id: string;
  title: string;
  type: OutputType;
  lang: Lang;
  engine: Engine;
  model: string;
  prompt: string;
  html: string;
  ragChunkTitles: string[];
  who: string;
  user: string;
  ago: string;
  source: "live" | "seed";
  systemPrompt?: string;
}

export function makeTitle(prompt: string, typeFr: string): string {
  let p = prompt.trim().replace(/^(un|une|le|la|des|génère|generate|crée|create|a|an)\s+/i, "");
  p = p.charAt(0).toUpperCase() + p.slice(1);
  if (p.length > 52) p = p.slice(0, 50) + "…";
  return typeFr + " — " + p;
}

// "il y a 3 min" depuis un timestamp ISO.
export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "hier" : `il y a ${d} j`;
}
