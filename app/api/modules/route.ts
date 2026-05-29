/**
 * PATCH /api/modules — édite un module de contexte (label / sub / live).
 * Stocké dans brand_config.context_modules. Auth requise (RLS brand_update_auth).
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ModuleMeta } from "@/lib/layerData";

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
  const { id, label, sub, live } = (body ?? {}) as Record<string, unknown>;
  if (typeof id !== "string") return NextResponse.json({ error: "id manquant." }, { status: 400 });

  const { data: row, error: readErr } = await supabase
    .from("brand_config")
    .select("context_modules")
    .eq("id", "default")
    .single();
  if (readErr || !row) {
    return NextResponse.json({ error: readErr?.message ?? "brand_config introuvable." }, { status: 500 });
  }

  const modules = (row.context_modules ?? []) as ModuleMeta[];
  const idx = modules.findIndex((m) => m.id === id);
  if (idx < 0) return NextResponse.json({ error: "Module introuvable." }, { status: 404 });

  const m = { ...modules[idx] };
  if (typeof label === "string" && label.trim()) m.label = label.trim();
  if (typeof sub === "string") m.sub = sub.trim();
  if (typeof live === "boolean") m.live = live;
  modules[idx] = m;

  const { error } = await supabase
    .from("brand_config")
    .update({ context_modules: modules, updated_at: new Date().toISOString() })
    .eq("id", "default");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ module: m });
}
