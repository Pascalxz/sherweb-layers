/**
 * embedChunksToSql.ts — calcule les embeddings des KNOWLEDGE_CHUNKS et émet du SQL.
 *
 * Utilitaire ponctuel : sert à seeder le corpus RAG via le MCP Supabase
 * (execute_sql) quand on n'a pas la SUPABASE_SERVICE_ROLE_KEY en local.
 * Le chemin nominal reste `npm run seed`. Ici on réutilise les mêmes données.
 *
 * Usage : OPENAI_API_KEY=… npx tsx scripts/embedChunksToSql.ts > /tmp/rag_seed.sql
 */

import { KNOWLEDGE_CHUNKS, embed } from "../seed";

function sqlEscape(s: string): string {
  return s.replace(/'/g, "''");
}

async function main() {
  const values: string[] = [];
  for (const c of KNOWLEDGE_CHUNKS) {
    const embedding = await embed(`${c.title}\n\n${c.content}`);
    const vec = `[${embedding.join(",")}]`;
    values.push(
      `('${sqlEscape(c.category)}', '${sqlEscape(c.title)}', '${sqlEscape(c.content)}', '${vec}'::vector)`,
    );
    process.stderr.write(`embedded: ${c.title}\n`);
  }
  process.stdout.write(
    "insert into public.knowledge_chunks (category, title, content, embedding) values\n" +
      values.join(",\n") +
      ";\n",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
