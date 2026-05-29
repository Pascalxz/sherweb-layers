/**
 * GET  /api/comments?generationId=... — liste les commentaires (façon Word) d'une génération.
 * POST /api/comments — ajoute un commentaire ancré { generationId, segIndex, quote, body }.
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const generationId = new URL(request.url).searchParams.get("generationId");
  if (!generationId) return NextResponse.json({ error: "generationId manquant." }, { status: 400 });

  const { data: rows } = await supabase
    .from("generation_comments")
    .select("id, seg_index, quote, body, user_id, resolved, created_at")
    .eq("generation_id", generationId)
    .order("created_at", { ascending: true });

  const ids = [...new Set((rows ?? []).map((r) => r.user_id as string))];
  const emailById = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await supabase.from("profiles").select("id, email").in("id", ids);
    for (const p of profs ?? []) emailById.set(p.id as string, p.email as string);
  }
  const comments = (rows ?? []).map((r) => ({ ...r, email: emailById.get(r.user_id as string) ?? "—" }));
  return NextResponse.json({ comments });
}

export async function POST(request: Request) {
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
  const { generationId, segIndex, quote, body: text } = (body ?? {}) as Record<string, unknown>;
  if (typeof generationId !== "string") return NextResponse.json({ error: "generationId manquant." }, { status: 400 });
  if (typeof text !== "string" || text.trim().length < 1) return NextResponse.json({ error: "Commentaire vide." }, { status: 400 });

  const { data, error } = await supabase
    .from("generation_comments")
    .insert({
      generation_id: generationId,
      seg_index: typeof segIndex === "number" ? segIndex : 0,
      quote: typeof quote === "string" ? quote.slice(0, 400) : null,
      body: text.trim(),
      user_id: user.id,
    })
    .select("id, seg_index, quote, body, user_id, resolved, created_at")
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Échec." }, { status: 500 });

  return NextResponse.json({ comment: { ...data, email: user.email ?? "—" } });
}
