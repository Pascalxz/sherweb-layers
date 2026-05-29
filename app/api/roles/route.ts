/**
 * POST /api/roles — assigne/retire un rôle à un utilisateur.
 * Auth requise. (Démo : tout utilisateur connecté peut gérer les rôles ; RLS roles_write_auth.)
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROLES } from "@/lib/workflow";

export const runtime = "nodejs";

const VALID = new Set(ROLES.map((r) => r.id));

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
  const { userId, role, op } = (body ?? {}) as Record<string, unknown>;
  if (typeof userId !== "string") return NextResponse.json({ error: "userId manquant." }, { status: 400 });
  if (typeof role !== "string" || !VALID.has(role as never)) {
    return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
  }

  if (op === "remove") {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
