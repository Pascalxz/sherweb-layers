/**
 * engines/index.ts — appels aux moteurs IA. SERVEUR UNIQUEMENT.
 *
 * Règle CLAUDE.md §7 : les clés ne sortent jamais côté client (appels via Route Handlers).
 * Règle §1 : ces fonctions ne sont JAMAIS appelées sans passer par contextBuilder en amont —
 * elles reçoivent un systemPrompt déjà enrichi par la couche.
 *
 * Claude est le moteur principal (ZDR activé au niveau de l'organisation Anthropic).
 * OpenAI est optionnel et sert à démontrer le multi-engine de la couche.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { Engine } from "@/lib/types";

// Modèles par défaut (surchargables par env). Claude = principal.
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

const MAX_TOKENS = 4096;
const TEMPERATURE = 0.4; // assez bas : on veut un HTML régulier et on-brand, pas créatif.

export interface EngineResult {
  text: string;
  model: string;
}

let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

function anthropicClient(): Anthropic {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return anthropic;
}
function openaiClient(): OpenAI {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return openai;
}

export async function runEngine(
  engine: Engine,
  systemPrompt: string,
  userPrompt: string,
): Promise<EngineResult> {
  return engine === "openai"
    ? runOpenAI(systemPrompt, userPrompt)
    : runClaude(systemPrompt, userPrompt);
}

async function runClaude(systemPrompt: string, userPrompt: string): Promise<EngineResult> {
  const res = await anthropicClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return { text, model: res.model };
}

async function runOpenAI(systemPrompt: string, userPrompt: string): Promise<EngineResult> {
  const res = await openaiClient().chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return { text: res.choices[0]?.message?.content ?? "", model: res.model };
}
