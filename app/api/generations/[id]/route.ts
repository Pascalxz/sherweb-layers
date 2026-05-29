/**
 * PATCH /api/generations/[id] — sauvegarde l'édition canvas (edited_html).
 *
 * RLS generations_update_self : seul le propriétaire de la génération peut la modifier.
 * Si la ligne n'appartient pas au user, l'update touche 0 ligne → 403.
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();

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

  const { editedHtml } = (body ?? {}) as Record<string, unknown>;
  if (typeof editedHtml !== "string" || editedHtml.trim().length === 0) {
    return NextResponse.json({ error: "editedHtml manquant." }, { status: 400 });
  }

  // RBAC : éditer le contenu requiert designer/coder/admin (ou être le propriétaire).
  const { data: gen } = await supabase.from("generations").select("user_id").eq("id", params.id).single();
  if (!gen) return NextResponse.json({ error: "Génération introuvable." }, { status: 404 });
  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = new Set((roleRows ?? []).map((r) => r.role as string));
  const canEdit = gen.user_id === user.id || roles.has("designer") || roles.has("coder") || roles.has("admin");
  if (!canEdit) {
    return NextResponse.json(
      { error: "Permission refusée : édition réservée aux rôles designer / développeur." },
      { status: 403 },
    );
  }

  const { data: updated, error } = await supabase
    .from("generations")
    .update({ edited_html: editedHtml, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Génération introuvable." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: params.id });
}
