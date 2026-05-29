/**
 * GET  /api/workflow/[id] — statut + historique des revues d'une génération.
 * POST /api/workflow/[id] — action workflow (submit | approve | reject | comment | ship).
 *   Permission APPLIQUÉE côté serveur : l'utilisateur doit détenir le rôle de l'étape courante
 *   (ou être admin, ou propriétaire pour les étapes 'requester'). Sinon 403.
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nextStatus, roleForStatus, type Role, type Status } from "@/lib/workflow";

export const runtime = "nodejs";

async function rolesOf(supabase: ReturnType<typeof createSupabaseServerClient>, userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.role as string));
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: gen } = await supabase.from("generations").select("status, user_id").eq("id", params.id).single();
  if (!gen) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  const { data: reviews } = await supabase
    .from("generation_reviews")
    .select("id, stage, action, role, user_id, comment, created_at")
    .eq("generation_id", params.id)
    .order("created_at", { ascending: true });

  const ids = [...new Set((reviews ?? []).map((r) => r.user_id as string))];
  const emailById = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await supabase.from("profiles").select("id, email").in("id", ids);
    for (const p of profs ?? []) emailById.set(p.id as string, p.email as string);
  }
  const enriched = (reviews ?? []).map((r) => ({ ...r, email: emailById.get(r.user_id as string) ?? "—" }));
  return NextResponse.json({ status: gen.status, reviews: enriched, myRoles: [...(await rolesOf(supabase, user.id))] });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
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
  const { action, comment } = (body ?? {}) as Record<string, unknown>;

  const { data: gen } = await supabase.from("generations").select("status, user_id").eq("id", params.id).single();
  if (!gen) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  const current = gen.status as Status;
  const isOwner = gen.user_id === user.id;
  const roles = await rolesOf(supabase, user.id);

  // Commentaire : ouvert à tous.
  if (action === "comment") {
    if (typeof comment !== "string" || !comment.trim())
      return NextResponse.json({ error: "Commentaire vide." }, { status: 400 });
    await supabase.from("generation_reviews").insert({
      generation_id: params.id, stage: current, action: "comment", role: null, user_id: user.id, comment: comment.trim(),
    });
    return NextResponse.json({ ok: true, status: current });
  }

  // Étapes valides par action.
  const reviewStages: Status[] = ["text_review", "design_review", "code_review", "qa", "requester_validation"];
  let newStatus: Status | null = null;
  if (action === "submit") {
    if (current !== "draft" && current !== "corrections")
      return NextResponse.json({ error: "Soumission impossible depuis cette étape." }, { status: 400 });
    newStatus = "text_review";
  } else if (action === "approve") {
    if (!reviewStages.includes(current)) return NextResponse.json({ error: "Rien à approuver ici." }, { status: 400 });
    newStatus = nextStatus(current);
  } else if (action === "reject") {
    if (!reviewStages.includes(current)) return NextResponse.json({ error: "Rien à rejeter ici." }, { status: 400 });
    newStatus = "corrections";
  } else if (action === "ship") {
    if (current !== "ready_dev") return NextResponse.json({ error: "Envoi prod impossible ici." }, { status: 400 });
    newStatus = "published";
  } else {
    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  }

  // Permission appliquée : rôle de l'étape courante.
  const required: Role | null = roleForStatus(current);
  const allowed = !required || roles.has(required) || roles.has("admin") || (required === "requester" && isOwner);
  if (!allowed) {
    return NextResponse.json(
      { error: `Permission refusée : rôle « ${required} » requis pour cette étape.` },
      { status: 403 },
    );
  }
  // Rôle à logger (compatible RLS : has_role(role) doit être vrai, sinon null).
  const reviewRole = required && roles.has(required) ? required : roles.has("admin") ? "admin" : null;

  const { error: upErr } = await supabase.from("generations").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", params.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  await supabase.from("generation_reviews").insert({
    generation_id: params.id,
    stage: current,
    action,
    role: reviewRole,
    user_id: user.id,
    comment: typeof comment === "string" && comment.trim() ? comment.trim() : null,
  });

  return NextResponse.json({ ok: true, status: newStatus });
}
