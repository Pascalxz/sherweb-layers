// Types partagés de la Sherweb Layer.
// Alignés sur le schéma Supabase (supabase/migrations/0001_init.sql).

export type Lang = "en" | "fr";

// Les deux outputs ciblés pour la démo (CLAUDE.md §2 : couper la largeur).
export type OutputType = "email" | "brief";

// Moteur IA. Claude est principal ; OpenAI démontre le multi-engine.
export type Engine = "claude" | "openai";

export interface DesignTokens {
  color: Record<string, string>;
  typography: {
    fontFamily: string;
    weights: Record<string, number>;
    headingLetterSpacing: string;
    bodyLetterSpacing: string;
    buttonLetterSpacing: string;
    minBodySize: string;
  };
  spacing: Record<string, string>;
  cta: {
    primary: { label: string; labelFr: string; bg: string; color: string };
    secondary: { label: string; labelFr: string; style: string };
  };
}

export interface ToneOfVoice {
  valueProposition: string;
  ctaTagline: string;
  pillars: { name: string; message: string }[];
  principles: string[];
  do: string[];
  dont: string[];
  bilingual: { note: string };
}

export interface BrandConfig {
  id: string;
  design_tokens: DesignTokens;
  tone_of_voice: ToneOfVoice;
  updated_at: string;
}

export interface GovernanceRule {
  id: string;
  category: string;
  rule: string;
  metadata: {
    approvedProofPoints?: string[];
    [key: string]: unknown;
  } | null;
}

export interface KnowledgeChunkMatch {
  id: string;
  category: string;
  title: string;
  content: string;
  similarity: number;
}

export interface Generation {
  id: string;
  user_id: string;
  output_type: OutputType;
  lang: Lang;
  prompt: string;
  output_html: string;
  edited_html: string | null;
  model: string;
  metadata: GenerationMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationMetadata {
  engine: Engine;
  ragChunkTitles: string[];
  ragChunkCount: number;
}

export interface GenerateRequest {
  prompt: string;
  outputType: OutputType;
  lang: Lang;
  engine: Engine;
}

export interface GenerateResponse {
  generationId: string;
  html: string;
  model: string;
  ragChunkTitles: string[];
}
