/**
 * PATCH /api/tone — édite le résumé de voix (brand_config.tone_of_voice.voice.{fr|en}).
 * Auth requise (RLS brand_update_auth). Injecté par contextBuilder dès la génération suivante.
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ToneOfVoice } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }
  const { lang, text } = (body ?? {}) as Record<string, unknown>;
  if (lang !== "fr" && lang !== "en") {
    return NextResponse.json({ error: "lang invalide (fr|en)." }, { status: 400 });
  }
  if (typeof text !== "string" || text.trim().length < 5) {
    return NextResponse.json({ error: "Texte trop court." }, { status: 400 });
  }

  const { data: row, error: readErr } = await supabase
    .from("brand_config")
    .select("tone_of_voice")
    .eq("id", "default")
    .single();
  if (readErr || !row) {
    return NextResponse.json({ error: readErr?.message ?? "brand_config introuvable." }, { status: 500 });
  }

  const tone = (row.tone_of_voice ?? {}) as ToneOfVoice;
  const voice = { fr: "", en: "", ...(tone.voice ?? {}), [lang]: text.trim() };
  const next = { ...tone, voice };

  const { error } = await supabase
    .from("brand_config")
    .update({ tone_of_voice: next, updated_at: new Date().toISOString() })
    .eq("id", "default");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, voice });
}
