/**
 * GET  /api/changes?generationId=... — modifications suivies d'une génération.
 * POST /api/changes — propose des modifications { generationId, edits:[{segIndex,original,proposed}] }.
 *   Réservé aux rôles éditeurs (writer/designer/coder/owner/admin).
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
    .from("generation_changes")
    .select("id, seg_index, original, proposed, author, status, created_at")
    .eq("generation_id", generationId)
    .order("created_at", { ascending: true });

  const ids = [...new Set((rows ?? []).map((r) => r.author as string))];
  const emailById = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await supabase.from("profiles").select("id, email").in("id", ids);
    for (const p of profs ?? []) emailById.set(p.id as string, p.email as string);
  }
  const changes = (rows ?? []).map((r) => ({ ...r, email: emailById.get(r.author as string) ?? "—" }));
  return NextResponse.json({ changes });
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
  const { generationId, edits } = (body ?? {}) as Record<string, unknown>;
  if (typeof generationId !== "string" || !Array.isArray(edits) || edits.length === 0) {
    return NextResponse.json({ error: "generationId/edits manquants." }, { status: 400 });
  }

  // RBAC : seuls les éditeurs peuvent proposer des modifications.
  const { data: gen } = await supabase.from("generations").select("user_id").eq("id", generationId).single();
  if (!gen) return NextResponse.json({ error: "Génération introuvable." }, { status: 404 });
  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = new Set((roleRows ?? []).map((r) => r.role as string));
  const canEdit =
    gen.user_id === user.id || roles.has("writer") || roles.has("designer") || roles.has("coder") || roles.has("admin");
  if (!canEdit) return NextResponse.json({ error: "Permission refusée." }, { status: 403 });

  const rows = (edits as { segIndex: number; original: string; proposed: string }[])
    .filter((e) => typeof e.proposed === "string" && e.proposed !== e.original)
    .map((e) => ({
      generation_id: generationId,
      seg_index: e.segIndex,
      original: e.original ?? "",
      proposed: e.proposed,
      author: user.id,
      status: "pending",
    }));
  if (rows.length === 0) return NextResponse.json({ error: "Aucune modification." }, { status: 400 });

  const { data, error } = await supabase.from("generation_changes").insert(rows).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: data?.length ?? 0 });
}
