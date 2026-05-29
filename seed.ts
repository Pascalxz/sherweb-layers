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

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Clients construits paresseusement : permet d'importer les données (KNOWLEDGE_CHUNKS…)
// depuis un autre script sans exiger les variables d'env ni déclencher d'effet de bord.
let _supabase: SupabaseClient | null = null;
let _openai: OpenAI | null = null;
const supabase = (): SupabaseClient =>
  (_supabase ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!));
const openai = () => (_openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY! }));

export const EMBEDDING_MODEL = "text-embedding-3-small"; // dimension 1536 — DOIT matcher le schéma pgvector

// ──────────────────────────────────────────────────────────────────────────
// 1. DESIGN TOKENS
// ──────────────────────────────────────────────────────────────────────────

export const DESIGN_TOKENS = {
  color: {
    // Source de vérité : design-system/colors_and_type.css (SW Brand 2025).
    primary: "#0061AA",        // Blue 700 — marque, liens, CTA outline
    primaryHover: "#0A4270",   // Blue 900 — hover du bleu marque
    secondary: "#0A96ED",      // Blue 600 — focus, liens secondaires, icônes
    accent: "#DB4227",         // Red 600 — CTA principal rempli (à utiliser avec parcimonie)
    accentHover: "#B93624",    // Red 700 — hover CTA
    headingText: "#090A0C",    // Ink 900 — titres
    bodyText: "#363B43",       // Ink 600 — paragraphes
    secondaryText: "#76889A",  // Slate 500 — descriptions, captions
    background: "#FFFFFF",
    backgroundTint: "#DFF0FF",  // Blue 100 — bandes de section douces
    backgroundAlt: "#F4F6F7",  // Slate 100 — sections alternées
    border: "#E2E7EB",         // Slate 200 — hairline
    heroDark: "#0A4270",       // Blue 900 — fond hero (stop clair du dégradé)
    footer: "#072A4A",         // Blue 950 — pied de page / inverse
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
  // Les 4 attributs de voix « toujours actifs » (design-system/README.md).
  principles: [
    "Professional — expert, precise, jamais hype ni familier ; on respecte le temps et l'intelligence du lecteur",
    "Neutral — factuel, faible densité d'adjectifs ; pas de hype, pas de peur, pas de flatterie",
    "Confident — on affirme la claim et on l'assume ; pas de hedging ('might', 'could help'), pas d'excuse",
    "Supportive — partner-first : le lecteur (le MSP) est le héros, Sherweb est le guide ; 'you' + 'we', jamais 'users'",
  ],
  do: [
    "Second person, direct: 'You can…', 'We can help'",
    "Headlines benefit-first: surface un changement ou une opportunité, pas une feature",
    "Sentence case pour titres, boutons et nav (pas de Title Case)",
    "CTAs = verbe + nom, 1–3 mots ('Get guide', 'Book a demo', 'Contact sales')",
    "Toujours deux niveaux de CTA : un fort (rempli rouge) + un doux (secondaire)",
    "Garder les noms propres tels quels : Microsoft 365, Azure, Acronis, Bitdefender, Dynamics 365",
  ],
  dont: [
    "Pas d'emoji (jamais) — l'iconographie c'est Font Awesome",
    "Pas de mots fluff : 'innovative', 'synergy', 'disruptive', 'cutting-edge'",
    "Pas de hedging ni d'excuses ; pas de ton purement vendeur",
    "Pas de 'Learn more' seul — toujours associé à quoi ('Get guide')",
    "Pas un seul CTA isolé ; pas de jargon technique non expliqué",
    "Pas de promesse de résultat garanti non sourcée",
  ],
  bilingual: {
    note: "EN et FR (Québec) sont tous deux first-class. Le FR n'est PAS une traduction littérale : adapter naturellement ('les MSP', 'nos experts', 'découvrez'). Phrases compactes pour reflow.",
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
      "Palette blue-forward avec un seul accent rouge. Bleu marque Blue 700 #0061AA (liens, marque, CTA outline). Bleu focus Blue 600 #0A96ED. Bleu accent Blue 500 #34AFFC, bleu clair Blue 300 #7BCAFE. Bleu profond Blue 950 #072A4A (fonds hero sombres, surfaces inverses). Tint Blue 100 #DFF0FF (bandes de section douces). Accent Red 600 #DB4227 (CTA principal rempli, à utiliser avec parcimonie), hover Red 700 #B93624. Texte ink Black 900 #090A0C, texte secondaire Slate #76889A, bordures #E2E7EB, surface #F4F6F7. Pas de violet, pas de teal, pas de neutres chauds. Dégradés uniquement sur les covers hero (#0A4270 → #072A4A).",
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
      "CTA principal: Red 600 #DB4227, texte blanc, border-radius 8px, weight 500, letter-spacing 1px, sentence case (pas uppercase). Hover: Red 700 #B93624. CTA secondaire: outline rouge sur fond blanc, se remplit au survol. Bouton bleu marque: #0061AA, hover #0A4270. Liens texte: Blue 700 #0061AA, soulignés 2px au survol. Libellés = verbe + nom, 1–3 mots (Get guide, Book a demo, Contact sales) — jamais 'Learn more' seul. Toujours deux niveaux: un CTA fort + un doux.",
  },
  {
    category: "brand_assets",
    title: "Voix de marque (4 attributs)",
    content:
      "La voix Sherweb tient 4 constantes sur chaque contenu. Professional: expert, précis, jamais hype ni familier. Neutral: factuel, faible densité d'adjectifs, pas de peur ni de flatterie. Confident: on affirme et on assume, pas de hedging ('might', 'could'), pas d'excuse. Supportive: partner-first, le MSP est le héros et Sherweb le guide — 'you' + 'we', jamais 'users'. Le ton se module par surface: marketing (chaleureux, direct), onboarding (utile), product UI (calme, label-first), erreurs/legal (factuel).",
  },
  {
    category: "brand_assets",
    title: "Règles d'écriture: casing, emoji, bilingue",
    content:
      "Sentence case pour titres, boutons et items de nav (pas de Title Case). All-caps réservé aux petits labels (letter-spacing 1px, 12–14px). Noms propres gardent leur casse: Microsoft 365, Azure, Acronis, Bitdefender, Dynamics 365, Cloud PBX. PAS d'emoji — l'iconographie est Font Awesome. Éviter les mots fluff: innovative, synergy, disruptive, cutting-edge. Bilingue EN/FR (Québec) tous deux first-class; le FR s'adapte naturellement ('les MSP', 'nos experts', 'découvrez'), jamais traduit littéralement.",
  },
  {
    category: "product_knowledge",
    title: "Catalogue produits et vendors",
    content:
      "La marketplace Sherweb agrège des solutions cloud pour MSP: Microsoft 365, Azure, Dynamics 365, Acronis (cyber protect, backup), Bitdefender, Dropsuite (backup SaaS), Proofpoint et IRONSCALES (sécurité email), Office Protect, Keeper et NordPass (gestion de mots de passe), NordLayer (accès réseau sécurisé), SentinelOne, Huntress, Check Point Harmony, Palisade, ConnectSecure, Cloud PBX, plus des outils d'automatisation/MSP comme Rewst, Kalibr8, Monjur, Nerdio et afiai. Les logos vendors s'affichent en chips/cartes sur fond clair #F4F6F7.",
  },
  {
    category: "approved_content",
    title: "Mission, vision et valeurs",
    content:
      "Mission: être le fournisseur de référence de solutions cloud business-class, en simplifiant l'accès et la gestion du cloud via une plateforme unifiée et une expérience one-stop pour partenaires et clients. Valeurs: Integrity (agir de façon éthique et transparente, dans le meilleur intérêt de l'équipe); Passion (soif d'excellence, amour du métier, engagement au succès de l'équipe); Teamwork (s'appuyer sur l'expertise des autres pour des résultats remarquables); Client orientation (écouter les besoins des clients, offrir une expérience de bout en bout exceptionnelle).",
  },
  {
    category: "approved_content",
    title: "Ce que les partenaires obtiennent",
    content:
      "Trois piliers de valeur. Marketplace: large catalogue de solutions cloud et sécurité. Partner services: white-label helpdesk, dedicated account management, Microsoft consultations, MDR for Microsoft 365, MDF consultations, presales services, technical & sales training, partner toolbox. Team of experts: passionate cloud experts, personalized advice, guided onboarding, sales assistance, 24/7 technical support, marketing support, aide à résoudre les défis business, tech account manager. Message: aidez vos clients à atteindre leurs objectifs tout en enrichissant votre offre, en augmentant vos marges et en devenant leur conseiller de confiance.",
  },
] as const;

// ──────────────────────────────────────────────────────────────────────────
// EXÉCUTION DU SEED
// ──────────────────────────────────────────────────────────────────────────

export async function embed(text: string): Promise<number[]> {
  const res = await openai().embeddings.create({ model: EMBEDDING_MODEL, input: text });
  return res.data[0].embedding; // length 1536
}

async function main() {
  console.log("→ Seeding governance_rules…");
  for (const g of GOVERNANCE_RULES) {
    const { error } = await supabase().from("governance_rules").upsert({
      id: g.id,
      category: g.category,
      rule: g.rule,
      metadata: g,
    });
    if (error) console.error(`  ✗ ${g.id}:`, error.message);
  }

  console.log("→ Seeding brand config (tokens + tone)…");
  {
    const { error } = await supabase().from("brand_config").upsert({
      id: "default",
      design_tokens: DESIGN_TOKENS,
      tone_of_voice: TONE_OF_VOICE,
    });
    if (error) console.error("  ✗ brand_config:", error.message);
  }

  console.log("→ Clearing knowledge_chunks (re-seed idempotent)…");
  {
    const { error } = await supabase()
      .from("knowledge_chunks")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // match all rows
    if (error) console.error("  ✗ clear:", error.message);
  }

  console.log("→ Seeding + embedding knowledge_chunks…");
  for (const c of KNOWLEDGE_CHUNKS) {
    const embedding = await embed(`${c.title}\n\n${c.content}`);
    const { error } = await supabase().from("knowledge_chunks").insert({
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

// N'exécute le seed que si le fichier est lancé directement (`tsx seed.ts`),
// pas lors d'un import depuis un autre script.
import { realpathSync } from "fs";
import { fileURLToPath } from "url";
const invokedDirectly = (() => {
  try {
    return !!process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main().catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });
}
