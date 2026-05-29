/**
 * POST /api/generate — pipeline complet de la Sherweb Layer.
 *
 *   auth → contextBuilder (marque + gouvernance + RAG) → moteur (Claude/OpenAI)
 *        → extraction HTML → persistance (generations, historique partagé)
 *
 * Route Handler serveur : les clés modèles ne touchent jamais le client (CLAUDE.md §7).
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildContext } from "@/lib/contextBuilder";
import { runEngine } from "@/lib/engines";
import { extractHtml } from "@/lib/sanitizeHtml";
import type {
  Engine,
  GenerateResponse,
  GenerationMetadata,
  Lang,
  OutputType,
} from "@/lib/types";

export const runtime = "nodejs";

const OUTPUT_TYPES: OutputType[] = ["email", "brief", "landing_page"];
const LANGS: Lang[] = ["en", "fr"];
const ENGINES: Engine[] = ["claude", "openai"];

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();

  // Auth : un user connecté est requis (RLS + traçabilité).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const { prompt, outputType, lang, engine } = (body ?? {}) as Record<string, unknown>;

  if (typeof prompt !== "string" || prompt.trim().length < 3) {
    return NextResponse.json({ error: "Prompt manquant ou trop court." }, { status: 400 });
  }
  if (!OUTPUT_TYPES.includes(outputType as OutputType)) {
    return NextResponse.json({ error: "outputType invalide (email|brief)." }, { status: 400 });
  }
  if (!LANGS.includes(lang as Lang)) {
    return NextResponse.json({ error: "lang invalide (en|fr)." }, { status: 400 });
  }
  if (!ENGINES.includes(engine as Engine)) {
    return NextResponse.json({ error: "engine invalide (claude|openai)." }, { status: 400 });
  }

  try {
    // 1. La couche : contexte de marque enrichi (JAMAIS d'appel nu — CLAUDE.md §1).
    const ctx = await buildContext(supabase, {
      prompt: prompt.trim(),
      outputType: outputType as OutputType,
      lang: lang as Lang,
    });

    // 2. Moteur.
    const result = await runEngine(engine as Engine, ctx.systemPrompt, ctx.userPrompt);
    const html = extractHtml(result.text);

    if (!html) {
      return NextResponse.json(
        { error: "Le moteur n'a pas produit de HTML exploitable." },
        { status: 502 },
      );
    }

    // 3. Persistance (historique partagé). RLS insert_self : user_id = auth.uid().
    const metadata: GenerationMetadata = {
      engine: engine as Engine,
      ragChunkTitles: ctx.ragChunks.map((c) => c.title),
      ragChunkCount: ctx.ragChunks.length,
      systemPrompt: ctx.systemPrompt,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        output_type: outputType as OutputType,
        lang: lang as Lang,
        prompt: prompt.trim(),
        output_html: html,
        model: result.model,
        metadata,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      return NextResponse.json(
        { error: `Persistance échouée : ${insertErr?.message ?? "inconnue"}` },
        { status: 500 },
      );
    }

    const response: GenerateResponse = {
      generationId: inserted.id,
      html,
      model: result.model,
      ragChunkTitles: metadata.ragChunkTitles,
      systemPrompt: ctx.systemPrompt,
    };
    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue.";
    console.error("/api/generate:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
