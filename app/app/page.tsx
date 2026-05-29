import { createSupabaseServerClient } from "@/lib/supabase/server";
import { outputMeta, MODULES, type ModuleMeta } from "@/lib/layerData";
import type { Engine, GenerationMetadata, Lang, OutputType } from "@/lib/types";
import Workspace from "./ws/Workspace";
import type { TeamMember } from "./ws/Roles";
import type { Role, Status } from "@/lib/workflow";
import type { GovCategory, GovRule, WSGen } from "./ws/types";
import { makeTitle, timeAgo } from "./ws/types";

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
  status: string;
}

function displayName(email: string): string {
  const n = (email.split("@")[0] || "").split(/[.\-_]/);
  return n[0] ? n[0][0].toUpperCase() + n[0].slice(1) + (n[1] ? " " + n[1][0].toUpperCase() + "." : "") : email;
}

export default async function AppHome() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userEmail = user?.email ?? "ppotvin@sherweb.com";

  const { data: rows } = await supabase
    .from("generations")
    .select("id, user_id, output_type, lang, prompt, output_html, edited_html, model, metadata, created_at, status")
    .order("created_at", { ascending: false })
    .limit(30);
  const generations = (rows ?? []) as GenerationRow[];

  // Emails auteurs pour l'effet « activité de l'équipe ».
  const authorIds = [...new Set(generations.map((g) => g.user_id))];
  const emailById = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", authorIds);
    for (const p of profiles ?? []) emailById.set(p.id as string, p.email as string);
  }

  const initialGens: WSGen[] = generations.map((g) => {
    const type = g.output_type as OutputType;
    const email = emailById.get(g.user_id) ?? "—";
    return {
      id: g.id,
      title: makeTitle(g.prompt, outputMeta(type)?.fr ?? type),
      type,
      lang: g.lang as Lang,
      engine: (g.metadata?.engine ?? "claude") as Engine,
      model: g.model,
      prompt: g.prompt,
      html: g.edited_html ?? g.output_html,
      ragChunkTitles: g.metadata?.ragChunkTitles ?? [],
      who: email === userEmail ? "Vous" : displayName(email),
      user: email,
      ago: timeAgo(g.created_at),
      source: "live",
      systemPrompt: g.metadata?.systemPrompt,
      status: (g.status ?? "draft") as Status,
      isOwner: g.user_id === user?.id,
    };
  });

  // Règles de gouvernance réelles (éditables dans la vue « La couche »).
  const { data: govRows } = await supabase
    .from("governance_rules")
    .select("id, category, rule, enabled")
    .order("created_at", { ascending: true });
  const governance: GovRule[] = (govRows ?? []).map((g) => ({
    id: g.id as string,
    category: g.category as GovCategory,
    rule: g.rule as string,
    enabled: (g.enabled as boolean) ?? true,
  }));

  // Tone of voice + modules de contexte éditables (brand_config).
  const { data: brandRow } = await supabase
    .from("brand_config")
    .select("tone_of_voice, context_modules")
    .eq("id", "default")
    .single();
  const tv = (brandRow?.tone_of_voice ?? {}) as { voice?: { fr?: string; en?: string } };
  const voice = { fr: tv.voice?.fr ?? "", en: tv.voice?.en ?? "" };
  const cm = brandRow?.context_modules as ModuleMeta[] | null | undefined;
  const modules = cm && cm.length > 0 ? cm : MODULES;

  // RBAC : rôles de l'utilisateur courant + équipe (profils + rôles) pour la vue Rôles.
  const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
  const rolesByUser = new Map<string, Role[]>();
  for (const r of allRoles ?? []) {
    const arr = rolesByUser.get(r.user_id as string) ?? [];
    arr.push(r.role as Role);
    rolesByUser.set(r.user_id as string, arr);
  }
  const myRoles = rolesByUser.get(user?.id ?? "") ?? [];

  const { data: allProfiles } = await supabase.from("profiles").select("id, email").order("created_at", { ascending: true });
  const users: TeamMember[] = (allProfiles ?? []).map((p) => ({
    id: p.id as string,
    email: p.email as string,
    roles: rolesByUser.get(p.id as string) ?? [],
  }));

  return (
    <Workspace
      initialGens={initialGens}
      userEmail={userEmail}
      governance={governance}
      voice={voice}
      modules={modules}
      myRoles={myRoles}
      users={users}
      currentUserId={user?.id ?? ""}
    />
  );
}

