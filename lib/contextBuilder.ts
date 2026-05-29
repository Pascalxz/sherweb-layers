/**
 * contextBuilder.ts — LE CŒUR DE LA SHERWEB LAYER.
 *
 * Règle CLAUDE.md §1 (non négociable) : JAMAIS d'appel à un modèle « nu ».
 * Tout appel à Claude/OpenAI passe OBLIGATOIREMENT par cette fonction, qui injecte :
 *   - le tone of voice (EN/FR)
 *   - les design tokens (couleurs, typo)
 *   - les governance rules + proof points officiels
 *   - le RAG : knowledge_chunks pertinents via similarité pgvector
 *   - la librairie de composants HTML fixes (régularité du markup)
 *
 * Retourne le system prompt enrichi + le user prompt + les chunks utilisés (pour traçabilité).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BrandConfig,
  GovernanceRule,
  KnowledgeChunkMatch,
  Lang,
  OutputType,
} from "@/lib/types";
import { embedText } from "@/lib/embeddings";
import { buildComponentLibraryPrompt } from "@/lib/components/htmlLibrary";

export interface BuiltContext {
  systemPrompt: string;
  userPrompt: string;
  ragChunks: KnowledgeChunkMatch[];
}

const RAG_MATCH_COUNT = 5;

// Cadrage par type d'output — chaque output reste un assemblage de composants fixes.
const OUTPUT_BRIEFS: Record<OutputType, string> = {
  email:
    "Tu produis un EMAIL marketing partenaire. Structure attendue : hero (accroche), 1–2 text-block, " +
    "éventuellement un product-card-grid (2 cartes max), un proof-points si pertinent, puis un cta-block de clôture. " +
    "Ton concis, orienté action, lisible en diagonale.",
  brief:
    "Tu produis un BRIEF (one-pager) destiné à un partenaire MSP. Structure attendue : hero, plusieurs text-block " +
    "structurés (contexte, valeur, preuves), un product-card-grid pour les piliers/features, un proof-points, " +
    "et un cta-block. Plus dense et informatif qu'un email, mais toujours scannable.",
  landing_page:
    "Tu produis une LANDING PAGE / microsite marketing. Structure riche : hero accrocheur, plusieurs text-block, " +
    "un product-card-grid (2–3 cartes), un proof-points, éventuellement un vendor-strip, et un cta-block de clôture. " +
    "Pensée pour convertir : bénéfice d'abord, scannable, double CTA.",
};

const LANG_INSTRUCTIONS: Record<Lang, string> = {
  en: "Rédige TOUT le contenu en anglais (registre professionnel nord-américain).",
  fr: "Rédige TOUT le contenu en français québécois professionnel. NE TRADUIS PAS littéralement : adapte naturellement (CLAUDE.md / gouvernance bilingue).",
};

export async function buildContext(
  supabase: SupabaseClient,
  params: { prompt: string; outputType: OutputType; lang: Lang },
): Promise<BuiltContext> {
  const { prompt, outputType, lang } = params;

  // 1. Brand config (tokens + tone of voice) — table single-row "default".
  const { data: brandRow, error: brandErr } = await supabase
    .from("brand_config")
    .select("id, design_tokens, tone_of_voice, updated_at")
    .eq("id", "default")
    .single();
  if (brandErr || !brandRow) {
    throw new Error(`contextBuilder: brand_config introuvable (${brandErr?.message ?? "no row"})`);
  }
  const brand = brandRow as BrandConfig;

  // 2. Governance rules.
  const { data: govRows, error: govErr } = await supabase
    .from("governance_rules")
    .select("id, category, rule, metadata")
    .eq("enabled", true);
  if (govErr) throw new Error(`contextBuilder: governance_rules — ${govErr.message}`);
  const governance = (govRows ?? []) as GovernanceRule[];

  // 3. RAG : embed du prompt → similarité pgvector via la fonction match_knowledge_chunks.
  let ragChunks: KnowledgeChunkMatch[] = [];
  try {
    const queryEmbedding = await embedText(`${outputType} — ${prompt}`);
    const { data: matches, error: matchErr } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: queryEmbedding,
      match_count: RAG_MATCH_COUNT,
    });
    if (matchErr) throw matchErr;
    ragChunks = (matches ?? []) as KnowledgeChunkMatch[];
  } catch (e) {
    // Le RAG est un enrichissement : on ne bloque pas la génération si le corpus est vide
    // ou si l'embedding échoue. La marque + la gouvernance restent injectées.
    console.warn("contextBuilder: RAG indisponible —", e instanceof Error ? e.message : e);
  }

  const systemPrompt = assembleSystemPrompt(brand, governance, ragChunks, outputType, lang);
  const userPrompt = prompt.trim();

  return { systemPrompt, userPrompt, ragChunks };
}

// ──────────────────────────────────────────────────────────────────────────
// Assemblage du system prompt enrichi.
// ──────────────────────────────────────────────────────────────────────────

function assembleSystemPrompt(
  brand: BrandConfig,
  governance: GovernanceRule[],
  ragChunks: KnowledgeChunkMatch[],
  outputType: OutputType,
  lang: Lang,
): string {
  const tone = brand.tone_of_voice;
  const tokens = brand.design_tokens;

  const proofPoints = collectProofPoints(governance);

  const toneSection = [
    ...(tone.voice?.[lang] ? [`Résumé de voix : ${tone.voice[lang]}`] : []),
    `Proposition de valeur : ${tone.valueProposition}`,
    `Tagline CTA : ${tone.ctaTagline}`,
    `Piliers : ${tone.pillars.map((p) => `${p.name} (${p.message})`).join(" · ")}`,
    `Principes : ${tone.principles.join(" ; ")}`,
    `À FAIRE : ${tone.do.join(" ; ")}`,
    `À ÉVITER : ${tone.dont.join(" ; ")}`,
  ].join("\n");

  const colorSection = [
    `Primaire (titres, liens, CTA outline) : ${tokens.color.primary}`,
    `Accent (CTA principal rempli) : ${tokens.color.accent}`,
    `Texte titres : ${tokens.color.headingText} · Texte courant : ${tokens.color.bodyText}`,
    `Police unique : ${tokens.typography.fontFamily} (min ${tokens.typography.minBodySize})`,
  ].join("\n");

  const govSection = governance
    .map((g) => `- [${g.category}] ${g.rule}`)
    .join("\n");

  const proofSection = proofPoints.length
    ? `PROOF POINTS OFFICIELS (les SEULS autorisés — n'en invente aucun) :\n${proofPoints
        .map((p) => `- ${p}`)
        .join("\n")}`
    : "Aucun proof point officiel fourni : n'avance AUCUN chiffre.";

  const ragSection = ragChunks.length
    ? ragChunks
        .map((c) => `### ${c.title} [${c.category}]\n${c.content}`)
        .join("\n\n")
    : "(Aucun chunk de connaissance pertinent — appuie-toi sur le tone of voice et les proof points.)";

  return `Tu es la « Sherweb Layer » : une couche de contrôle de marque qui transforme une demande \
en contenu marketing ON-BRAND pour Sherweb (distributeur cloud pour MSP).

${LANG_INSTRUCTIONS[lang]}

## Mission pour cette génération
${OUTPUT_BRIEFS[outputType]}

## Tone of voice (obligatoire)
${toneSection}

## Design tokens (couleurs & typo — ne dévie jamais de la palette)
${colorSection}

## Règles de gouvernance (garde-fous — à respecter sans exception)
${govSection}

${proofSection}

## Connaissances pertinentes (RAG)
${ragSection}

## Librairie de composants HTML (assemblage STRICT)
${buildComponentLibraryPrompt()}

## Format de sortie (impératif)
- Réponds UNIQUEMENT avec le HTML des composants assemblés, dans l'ordre logique.
- AUCUN texte avant ou après, AUCun bloc \`\`\`, AUCUN <html>/<head>/<body> : seulement les <section>/<footer> des composants.
- Toujours deux niveaux de CTA (fort + doux), couleurs de la palette uniquement, proof points officiels uniquement.`;
}

function collectProofPoints(governance: GovernanceRule[]): string[] {
  const set = new Set<string>();
  for (const g of governance) {
    const points = g.metadata?.approvedProofPoints;
    if (Array.isArray(points)) points.forEach((p) => set.add(p));
  }
  return [...set];
}
