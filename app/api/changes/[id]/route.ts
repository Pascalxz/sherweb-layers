/**
 * PATCH /api/changes/[id] — accepter/refuser une modification suivie { action: 'accept'|'reject' }.
 *   Accepter applique le texte proposé au HTML (edited_html). Réservé aux éditeurs.
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
  const { action } = (body ?? {}) as Record<string, unknown>;
  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "action invalide (accept|reject)." }, { status: 400 });
  }

  const { data: change } = await supabase
    .from("generation_changes")
    .select("id, generation_id, seg_index, original, proposed, status")
    .eq("id", params.id)
    .single();
  if (!change) return NextResponse.json({ error: "Modification introuvable." }, { status: 404 });
  if (change.status !== "pending") return NextResponse.json({ error: "Déjà traitée." }, { status: 400 });

  // RBAC éditeur (idem proposer).
  const { data: gen } = await supabase
    .from("generations")
    .select("user_id, output_html, edited_html")
    .eq("id", change.generation_id)
    .single();
  if (!gen) return NextResponse.json({ error: "Génération introuvable." }, { status: 404 });
  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = new Set((roleRows ?? []).map((r) => r.role as string));
  const canEdit =
    gen.user_id === user.id || roles.has("writer") || roles.has("designer") || roles.has("coder") || roles.has("admin");
  if (!canEdit) return NextResponse.json({ error: "Permission refusée." }, { status: 403 });

  if (action === "accept") {
    // Applique le texte proposé au segment correspondant du HTML courant.
    const html = (gen.edited_html as string | null) ?? (gen.output_html as string);
    const applied = applyToSegment(html, change.seg_index as number, change.original as string, change.proposed as string);
    if (applied) {
      const { error: upErr } = await supabase
        .from("generations")
        .update({ edited_html: applied, updated_at: new Date().toISOString() })
        .eq("id", change.generation_id);
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
  }

  const { error } = await supabase
    .from("generation_changes")
    .update({ status: action === "accept" ? "accepted" : "rejected" })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// Remplace le texte du Nième élément textuel (h1,h2,h3,p,li,a) par regex légère côté serveur.
function applyToSegment(html: string, segIndex: number, original: string, proposed: string): string | null {
  const re = /(<(?:h1|h2|h3|p|li|a)\b[^>]*>)([\s\S]*?)(<\/(?:h1|h2|h3|p|li|a)>)/gi;
  let i = -1;
  let found = false;
  const out = html.replace(re, (m, open, inner, close) => {
    i++;
    if (i !== segIndex) return m;
    found = true;
    // Remplace en conservant les balises internes si le texte plein matche.
    const plain = inner.replace(/<[^>]+>/g, "");
    if (plain.trim() === original.trim()) {
      return `${open}${escapeInner(proposed)}${close}`;
    }
    // sinon remplacement plein
    return `${open}${escapeInner(proposed)}${close}`;
  });
  return found ? out : null;
}
function escapeInner(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
