/**
 * POST /api/governance — crée une règle de gouvernance.
 * Auth requise. RLS gov_insert_auth autorise les utilisateurs connectés.
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CATEGORIES = ["legal", "brand", "compliance"];

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
  const { category, rule } = (body ?? {}) as Record<string, unknown>;
  if (!CATEGORIES.includes(category as string)) {
    return NextResponse.json({ error: "Catégorie invalide (legal|brand|compliance)." }, { status: 400 });
  }
  if (typeof rule !== "string" || rule.trim().length < 5) {
    return NextResponse.json({ error: "Règle trop courte." }, { status: 400 });
  }

  const id = `gov-custom-${Date.now()}`;
  const { data, error } = await supabase
    .from("governance_rules")
    .insert({ id, category, rule: rule.trim(), enabled: true })
    .select("id, category, rule, enabled")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Insertion échouée." }, { status: 500 });
  }
  return NextResponse.json({ rule: data });
}
