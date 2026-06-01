/**
 * POST /api/generations/[id]/revise — révision IA on-brand d'un document existant.
 * Le rédacteur décrit une correction en langage naturel ; le contenu repasse par la couche
 * (contextBuilder) puis par le moteur, qui RÉVISE le HTML existant (mêmes composants fixes).
 * Réservé aux rôles éditeurs. Sauvegarde dans edited_html + journalise une review.
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildContext } from "@/lib/contextBuilder";
import { runEngine } from "@/lib/engines";
import { extractHtml } from "@/lib/sanitizeHtml";
import type { Engine, Lang, OutputType } from "@/lib/types";

export const runtime = "nodejs";

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
  const { instruction } = (body ?? {}) as Record<string, unknown>;
  if (typeof instruction !== "string" || instruction.trim().length < 3) {
    return NextResponse.json({ error: "Instruction de correction manquante." }, { status: 400 });
  }

  const { data: gen } = await supabase
    .from("generations")
    .select("user_id, output_type, lang, prompt, output_html, edited_html, metadata")
    .eq("id", params.id)
    .single();
  if (!gen) return NextResponse.json({ error: "Génération introuvable." }, { status: 404 });

  // RBAC : éditeurs uniquement.
  const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = new Set((roleRows ?? []).map((r) => r.role as string));
  const canEdit =
    gen.user_id === user.id || roles.has("writer") || roles.has("designer") || roles.has("coder") || roles.has("admin");
  if (!canEdit) return NextResponse.json({ error: "Permission refusée." }, { status: 403 });

  const currentHtml = (gen.edited_html as string | null) ?? (gen.output_html as string);
  const engine = ((gen.metadata as { engine?: Engine } | null)?.engine ?? "claude") as Engine;

  // La couche : on réinjecte tout le contexte de marque (jamais d'appel nu — CLAUDE.md §1).
  const ctx = await buildContext(supabase, {
    prompt: gen.prompt as string,
    outputType: gen.output_type as OutputType,
    lang: gen.lang as Lang,
  });

  const revisePrompt = `Voici un document HTML déjà généré (assemblage de composants fixes de la librairie). \
Applique UNIQUEMENT la correction demandée, en conservant le reste tel quel, les mêmes balises/classes/composants, \
et en respectant le tone of voice, les design tokens et la gouvernance ci-dessus.

[CORRECTION DEMANDÉE]
${instruction.trim()}

[DOCUMENT ACTUEL]
${currentHtml}

Réponds UNIQUEMENT avec le HTML révisé complet (composants only, aucun préambule).`;

  let revised: string;
  let model: string;
  try {
    const result = await runEngine(engine, ctx.systemPrompt, revisePrompt);
    revised = extractHtml(result.text);
    model = result.model;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Échec moteur." }, { status: 502 });
  }
  if (!revised) return NextResponse.json({ error: "Le moteur n'a pas produit de HTML exploitable." }, { status: 502 });

  const { error: upErr } = await supabase
    .from("generations")
    .update({ edited_html: revised, updated_at: new Date().toISOString() })
    .eq("id", params.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Journalise la correction comme une revue (action comment, traçabilité).
  await supabase.from("generation_reviews").insert({
    generation_id: params.id,
    stage: "corrections",
    action: "comment",
    role: null,
    user_id: user.id,
    comment: `Correction IA : ${instruction.trim()}`,
  });

  return NextResponse.json({ ok: true, html: revised, model });
}
