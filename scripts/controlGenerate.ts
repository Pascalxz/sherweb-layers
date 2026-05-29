/**
 * controlGenerate.ts — génération de contrôle HEADLESS.
 * Réutilise le VRAI pipeline de l'app (contextBuilder → moteur → extractHtml),
 * avec un client service-role à la place du client authentifié. Test only.
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { buildContext } from "../lib/contextBuilder";
import { runEngine } from "../lib/engines";
import { extractHtml } from "../lib/sanitizeHtml";
import { renderDocument } from "../lib/components/htmlLibrary";

const prompt =
  process.env.PROMPT ??
  "Un brief pour positionner Acronis Cyber Protect Cloud auprès d'un MSP : backup et cybersécurité intégrés, RPO/RTO quasi nuls, sans coût additionnel.";
const outputType = (process.env.OUTPUT ?? "brief") as "email" | "brief";
const lang = (process.env.LANG2 ?? "en") as "en" | "fr";

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const ctx = await buildContext(supabase, { prompt, outputType, lang });
  console.log("── RAG chunks retenus ──");
  ctx.ragChunks.forEach((c) =>
    console.log(`  • [${c.category}] ${c.title}  (sim ${c.similarity.toFixed(3)})`),
  );

  const res = await runEngine("claude", ctx.systemPrompt, ctx.userPrompt);
  const html = extractHtml(res.text);
  writeFileSync("/tmp/control.html", renderDocument(html));

  console.log(`\n── Output (${res.model}) ──`);
  console.log(`HTML length: ${html.length}`);
  console.log(`Composants: ${[...html.matchAll(/data-sw-component="([^"]+)"/g)].map((m) => m[1]).join(", ")}`);
  console.log(`Document rendu → /tmp/control.html`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
