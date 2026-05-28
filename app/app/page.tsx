import { createSupabaseServerClient } from "@/lib/supabase/server";
import Generator from "./Generator";
import HistoryList, { type HistoryEntry } from "./HistoryList";
import type { GenerationMetadata } from "@/lib/types";

export const dynamic = "force-dynamic";

interface GenerationRow {
  id: string;
  user_id: string;
  output_type: string;
  lang: string;
  prompt: string;
  output_html: string;
  edited_html: string | null;
  model: string;
  metadata: GenerationMetadata | null;
  created_at: string;
}

export default async function AppHome() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Historique partagé : tout le monde voit tout (CLAUDE.md §5).
  const { data: rows } = await supabase
    .from("generations")
    .select("id, user_id, output_type, lang, prompt, output_html, edited_html, model, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  const generations = (rows ?? []) as GenerationRow[];

  // Résolution des emails auteurs (profiles) pour l'effet "activité de l'équipe".
  const authorIds = [...new Set(generations.map((g) => g.user_id))];
  const emailById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", authorIds);
    for (const p of profiles ?? []) emailById.set(p.id as string, p.email as string);
  }

  const entries: HistoryEntry[] = generations.map((g) => ({
    id: g.id,
    output_type: g.output_type,
    lang: g.lang,
    prompt: g.prompt,
    html: g.edited_html ?? g.output_html,
    model: g.model,
    engine: g.metadata?.engine ?? null,
    authorEmail: emailById.get(g.user_id) ?? null,
    createdAt: g.created_at,
  }));

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto space-y-12">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-button text-sherweb-muted">Sherweb Layer</p>
        <h1 className="text-3xl">Studio</h1>
        <p className="text-sherweb-body">
          {user?.email ? `Connecté en tant que ${user.email}. ` : ""}
          Chaque génération passe par la couche de marque (tone of voice + design tokens + gouvernance + RAG).
        </p>
      </header>

      <Generator />

      <section className="space-y-4">
        <h2 className="text-xl">Activité de l'équipe</h2>
        <HistoryList entries={entries} />
      </section>
    </main>
  );
}
