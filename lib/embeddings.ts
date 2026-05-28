// embeddings.ts — calcul d'embeddings pour le RAG.
// Modèle figé : OpenAI text-embedding-3-small → dimension 1536 (DOIT matcher pgvector).
// Serveur uniquement : la clé OPENAI_API_KEY ne sort jamais côté client.

import OpenAI from "openai";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIM = 1536;

let client: OpenAI | null = null;
function openai(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return client;
}

export async function embedText(text: string): Promise<number[]> {
  const res = await openai().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return res.data[0].embedding; // length 1536
}
