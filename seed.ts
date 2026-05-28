/**
 * seed.ts — Données initiales de la Sherweb Layer
 * ------------------------------------------------
 * Source de vérité : skill `sherweb-brand` (Brand Guidelines 2025).
 *
 * Contenu :
 *   1. DESIGN_TOKENS      → couleurs, typo, spacing injectés dans le system prompt + Tailwind
 *   2. TONE_OF_VOICE      → principes EN/FR, do/don't, injectés dans chaque génération
 *   3. GOVERNANCE_RULES   → garde-fous filtrés par prompt (pas de classifieur NLP)
 *   4. KNOWLEDGE_CHUNKS   → corpus à vectoriser (text-embedding-3-small, dim 1536) pour le RAG
 *
 * Usage : `npx tsx seed.ts` après migration du schéma.
 * Embeddings calculés à l'insertion via OpenAI. Les chunks sont volontairement
 * peu nombreux mais réels — suffisant pour démontrer le RAG en démo.
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const EMBEDDING_MODEL = "text-embedding-3-small"; // dimension 1536 — DOIT matcher le schéma pgvector

// ──────────────────────────────────────────────────────────────────────────
// 1. DESIGN TOKENS
// ──────────────────────────────────────────────────────────────────────────

export const DESIGN_TOKENS = {
  color: {
    // Workhorses — voir skill sherweb-brand §1
    primary: "#0076cb",        // Blue 600 — CTAs outline, titres, liens "Learn more"
    primaryHover: "#0061aa",   // Blue 700
    secondary: "#0a96ed",      // Blue 500 — boutons secondaires, liens, icônes
    accent: "#db4227",         // Red 600 — boutons remplis "Get started", CTA principal
    accentHover: "#b8351d",    // Red 700
    headingText: "#363b43",    // Black 900 — H1, H2
    bodyText: "#434d5b",       // Black 700 — paragraphes
    secondaryText: "#5a6b80",  // Black 500 — descriptions, captions
    background: "#FFFFFF",
    backgroundAlt: "#f4f6f7",  // Black 50 — sections alternées
    border: "#e2e7eb",         // Black 100
    heroDark: "#0a4270",       // Blue 900 — fonds hero sombres
    footer: "#072a4a",         // Blue 950
  },
  typography: {
    fontFamily: "Montserrat, sans-serif",
    weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    // Règles : headings letter-spacing négatif, body +0.25px, boutons +1px, min 16px web
    headingLetterSpacing: "-0.5px",
    bodyLetterSpacing: "0.25px",
    buttonLetterSpacing: "1px",
    minBodySize: "16px",
  },
  spacing: {
    // base Tailwind — voir skill §3
    buttonPadding: "8px 24px",
    cardGap: "24px",          // gap-6
    sectionGap: "64px",       // py-16
    containerPaddingDesktop: "32px 64px",
    radius: "8px",            // border-radius standard boutons
  },
  cta: {
    // Toujours 2 niveaux : fort + doux (voir tone of voice)
    primary: { label: "Get started", labelFr: "Commencer", bg: "#db4227", color: "#FFFFFF" },
    secondary: { label: "Request discovery call", labelFr: "Demander un appel découverte", style: "outline" },
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────
// 2. TONE OF VOICE  (injecté dans le system prompt de chaque génération)
// ──────────────────────────────────────────────────────────────────────────

export const TONE_OF_VOICE = {
  valueProposition: "More than a cloud distributor — real experts, strategic guidance, a team that works with you.",
  ctaTagline: "Ready for a partner who puts you first?",
  pillars: [
    { name: "Simplification", message: "Manage it all in one intuitive platform" },
    { name: "Profitability", message: "Opportunities to earn more as you grow" },
    { name: "Exceptional support", message: "Real support from real people" },
    { name: "Innovation", message: "Expert advice that moves you forward" },
  ],
  principles: [
    "Human and warm — real support from real people",
    "Partner-oriented — a partner who puts you first, never salesy",
    "Measurable results — quantify benefits (%, $, time saved)",
    "Confident and reassuring — easy to work with, we make it simple",
    "Action-oriented — clear CTAs",
  ],
  do: [
    "Use partner-centered language (you, your growth)",
    "Quantify benefits with proof points",
    "Offer two CTA levels: strong primary + softer secondary",
    "Write for the MSP audience (use their vocabulary appropriately)",
  ],
  dont: [
    "Use unexplained technical jargon",
    "Make impossible promises",
    "Write generic filler text",
    "Provide only one CTA with no soft alternative",
    "Use overly corporate or 'perfect' imagery language",
  ],
  bilingual: {
    note: "Partner-first in both EN and FR. FR is not a literal translation — adapt naturally.",
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────
// 3. GOVERNANCE RULES  (garde-fous par prompt — filtrés avant/après génération)
// ──────────────────────────────────────────────────────────────────────────

export const GOVERNANCE_RULES = [
  {
    id: "gov-proof-accuracy",
    category: "legal",
    rule: "N'utiliser que les proof points officiels validés. Ne jamais inventer de statistique.",
    approvedProofPoints: [
      "30,000+ MSP partners",
      "Microsoft Solutions Partner",
      "SOC2 Type II certified",
      "24/7 support, <30 min response",
      "30+ years experience, 98 certifications",
      "85% easy to work with",
      "88% would recommend",
      "85% onboarding is simple",
    ],
  },
  {
    id: "gov-no-promises",
    category: "legal",
    rule: "Aucune promesse de résultat garanti (revenus, croissance chiffrée non sourcée). Formuler en opportunité, pas en garantie.",
  },
  {
    id: "gov-brand-colors",
    category: "brand",
    rule: "N'utiliser que les couleurs de la palette Sherweb. CTA principal en Red 600, liens/titres en Blue 600. Signaler toute couleur hors-palette.",
  },
  {
    id: "gov-cta-pattern",
    category: "brand",
    rule: "Toujours deux niveaux de CTA : un fort (Get started) + un doux (Request discovery call). Jamais un seul CTA isolé.",
  },
  {
    id: "gov-partner-first",
    category: "brand",
    rule: "Langage centré partenaire ('you', 'your growth'). Jamais de ton agressif ou purement vendeur.",
  },
  {
    id: "gov-bilingual",
    category: "compliance",
    rule: "Contenu FR adapté naturellement, pas traduit littéralement de l'EN. Respecter le registre québécois professionnel.",
  },
] as const;

// ──────────────────────────────────────────────────────────────────────────
// 4. KNOWLEDGE CHUNKS  (corpus RAG — vectorisé à l'insertion)
//    Catégories alignées sur le diagramme : brand_assets, approved_content, product_knowledge
// ──────────────────────────────────────────────────────────────────────────

export const KNOWLEDGE_CHUNKS = [
  // ── Approved Content ──
  {
    category: "approved_content",
    title: "Value proposition principale",
    content:
      "More than a cloud distributor. We go beyond cloud distribution to give you access to real experts, strategic guidance and a team that works with you to achieve your goals. MSPs who partner with Sherweb get more: the cloud marketplace that powers your potential, with a human approach that MSPs value.",
  },
  {
    category: "approved_content",
    title: "Les quatre piliers Sherweb",
    content:
      "Simplification: manage it all in one intuitive platform. Profitability: opportunities to earn more as you grow. Exceptional support: real support from real people. Innovation: expert advice that moves you forward.",
  },
  {
    category: "approved_content",
    title: "Programmes partenaires",
    content:
      "White-label (le plus populaire): vous détenez la relation client, vous vendez sous votre propre marque. Co-branded: vous vendez avec votre marque et celle de Sherweb. Advisor: Sherweb détient la relation client. Chaque modèle s'adapte au niveau de contrôle souhaité par le partenaire.",
  },
  {
    category: "approved_content",
    title: "Segments MSP et messages",
    content:
      "Emerging (5-15 employés, <2M$ ARR): start fast, scale with confidence. Growth (15-50 employés, 2-10M$ ARR): accelerate your growth. Enterprise (50+ employés, 10M$+ ARR): enterprise solutions for enterprise ambitions.",
  },

  // ── Product Knowledge ──
  {
    category: "product_knowledge",
    title: "Fonctionnalités de la plateforme",
    content:
      "Provisionnement de licences en un clic. Workflows entièrement connectés (PSA, RMM, facturation). Facturation mensuelle consolidée et simplifiée. Support client centralisé. Reporting en temps réel. Sécurité de niveau entreprise: MFA, Entra ID, SOC2.",
  },
  {
    category: "product_knowledge",
    title: "Portail self-service",
    content:
      "Portail self-service en marque blanche, entièrement personnalisable. Catalogues, workflows, SKUs et bundles adaptables aux besoins du partenaire.",
  },
  {
    category: "product_knowledge",
    title: "Intégrations clés",
    content:
      "ConnectWise, Autotask, Rewst, Kaseya BMS, QuickBooks, CIPP, HaloPSA, Pia, et l'API Sherweb. Ces intégrations connectent les workflows PSA/RMM/facturation des MSP à la marketplace.",
  },
  {
    category: "product_knowledge",
    title: "Vocabulaire MSP",
    content:
      "Termes du domaine à utiliser avec justesse: MRR, ARPU, MSA, SLA, PSA, RMM, CLTV, CAC, recurring revenue, tech stack, profit margin, cyber-resilience, compliance, scalability.",
  },

  // ── Brand Assets ──
  {
    category: "brand_assets",
    title: "Système de couleurs",
    content:
      "Couleur primaire Blue 600 #0076cb (boutons outline, liens, titres). Accent Red 600 #db4227 (boutons remplis Get started, CTA principal). Texte titres Black 900 #363b43. Texte courant Black 700 #434d5b. Fond blanc, sections alternées Black 50 #f4f6f7, bordures Black 100 #e2e7eb.",
  },
  {
    category: "brand_assets",
    title: "Typographie",
    content:
      "Une seule police: Montserrat (Bold, Semibold, Medium, Regular). Titres en letter-spacing négatif pour un rendu serré et impactant. Corps de texte en letter-spacing positif (+0.25px) pour la lisibilité. Boutons toujours +1px. Minimum 16px pour le texte web (accessibilité).",
  },
  {
    category: "brand_assets",
    title: "Personas photographiques",
    content:
      "MSP Decision-maker (audience primaire, 35-55 ans, business casual jamais de cravate, pas trop léché). Sherweb Sales (25-35 ans, presque 50/50 H/F, extraverti, confiant). Sherweb Technical (25-55 ans, look geek pop culture, grande diversité). Toujours de vrais humains, lumière naturelle, expressions authentiques, jamais ultra-corporate ni model-like.",
  },
  {
    category: "brand_assets",
    title: "Patterns de CTA et boutons",
    content:
      "CTA principal: Red 600 #db4227, texte blanc, border-radius 8px. CTA secondaire: outline Black 900 ou Blue 600, fond transparent. Liens texte: Blue 600 #0076cb, soulignés au survol. Toujours offrir deux niveaux: un CTA fort (Get started) et un doux (Request discovery call).",
  },
] as const;

// ──────────────────────────────────────────────────────────────────────────
// EXÉCUTION DU SEED
// ──────────────────────────────────────────────────────────────────────────

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return res.data[0].embedding; // length 1536
}

async function main() {
  console.log("→ Seeding governance_rules…");
  for (const g of GOVERNANCE_RULES) {
    const { error } = await supabase.from("governance_rules").upsert({
      id: g.id,
      category: g.category,
      rule: g.rule,
      metadata: g,
    });
    if (error) console.error(`  ✗ ${g.id}:`, error.message);
  }

  console.log("→ Seeding brand config (tokens + tone)…");
  {
    const { error } = await supabase.from("brand_config").upsert({
      id: "default",
      design_tokens: DESIGN_TOKENS,
      tone_of_voice: TONE_OF_VOICE,
    });
    if (error) console.error("  ✗ brand_config:", error.message);
  }

  console.log("→ Seeding + embedding knowledge_chunks…");
  for (const c of KNOWLEDGE_CHUNKS) {
    const embedding = await embed(`${c.title}\n\n${c.content}`);
    const { error } = await supabase.from("knowledge_chunks").insert({
      category: c.category,
      title: c.title,
      content: c.content,
      embedding, // pgvector(1536)
    });
    if (error) console.error(`  ✗ ${c.title}:`, error.message);
    else console.log(`  ✓ ${c.title}`);
  }

  console.log("✅ Seed terminé.");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
