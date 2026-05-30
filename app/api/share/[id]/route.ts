/**
 * POST   /api/share/[id] — génère (ou renvoie) le token de partage public d'une génération.
 * DELETE /api/share/[id] — révoque le token (le lien public cesse de fonctionner).
 * Réservé au propriétaire ou admin.
 */
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function canShare(supabase: ReturnType<typeof createSupabaseServerClient>, userId: string, genUserId: string) {
  if (userId === genUserId) return true;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).some((r) => r.role === "admin");
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: gen } = await supabase
    .from("generations")
    .select("user_id, share_token")
    .eq("id", params.id)
    .single();
  if (!gen) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  if (!(await canShare(supabase, user.id, gen.user_id as string))) {
    return NextResponse.json({ error: "Permission refusée (propriétaire ou admin)." }, { status: 403 });
  }

  let token = gen.share_token as string | null;
  if (!token) {
    token = randomBytes(12).toString("base64url");
    const { error } = await supabase.from("generations").update({ share_token: token }).eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ token });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: gen } = await supabase.from("generations").select("user_id").eq("id", params.id).single();
  if (!gen) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  if (!(await canShare(supabase, user.id, gen.user_id as string))) {
    return NextResponse.json({ error: "Permission refusée." }, { status: 403 });
  }

  const { error } = await supabase.from("generations").update({ share_token: null }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
