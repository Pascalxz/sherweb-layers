/**
 * PATCH /api/governance/[id]  — modifie le texte / l'activation / la catégorie d'une règle.
 * DELETE /api/governance/[id] — supprime une règle.
 * Auth requise (RLS gov_update_auth / gov_delete_auth).
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CATEGORIES = ["legal", "brand", "compliance"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
  const { rule, enabled, category } = (body ?? {}) as Record<string, unknown>;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof rule === "string") {
    if (rule.trim().length < 5) return NextResponse.json({ error: "Règle trop courte." }, { status: 400 });
    patch.rule = rule.trim();
  }
  if (typeof enabled === "boolean") patch.enabled = enabled;
  if (typeof category === "string") {
    if (!CATEGORIES.includes(category)) return NextResponse.json({ error: "Catégorie invalide." }, { status: 400 });
    patch.category = category;
  }

  const { data, error } = await supabase
    .from("governance_rules")
    .update(patch)
    .eq("id", params.id)
    .select("id, category, rule, enabled");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Règle introuvable." }, { status: 404 });
  return NextResponse.json({ rule: data[0] });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { error } = await supabase.from("governance_rules").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
