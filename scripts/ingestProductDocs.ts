/**
 * ingestProductDocs.ts — ingère un SOUS-ENSEMBLE CURÉ de datasheets produits dans le RAG.
 *
 * Philosophie PRD (CLAUDE.md) : « quelques chunks suffisent ». On vectorise une sélection
 * de docs CUSTOMER-FACING (pas de battlecards / comparatifs internes — gouvernance).
 *
 * Les docs bruts ne sont PAS committés (repo public + matériel partiellement interne).
 * Le script lit depuis DOCS_DIR (défaut ./.product-docs, gitignored) ; les chunks vivent
 * ensuite dans Supabase (DB privée). Idempotent : purge les chunks category='product_doc'.
 *
 * Usage :
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… OPENAI_API_KEY=… \
 *   DOCS_DIR=./.product-docs npx tsx scripts/ingestProductDocs.ts
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { embed } from "../seed";

const DOCS_DIR = process.env.DOCS_DIR ?? "./.product-docs";
const CATEGORY = "product_doc";
const MAX_CHARS = 1200; // ~300 tokens par chunk
const MIN_CHARS = 200;

// Sélection curée customer-facing (produits clés, EN + FR si dispo). Pas de battlecards.
const ALLOWLIST = [
  "Acronis-Cyber-Protect-Cloud-EN.md",
  "Acronis-Cyber-Protect-Cloud-FR.md",
  "Azure-Services-Brochure-V1-EN.md",
  "Azure-Services-Brochure-V1-FR.md",
  "m365_pack_overview.md",
  "m365_copilot_pack_overview.md",
  "voip-features-cloud-pbx.md",
  "voip-features-cloud-pbx-fr.md",
  "ConnectSecure-solution-datasheet.md",
  "Check-Point-Harmony-Email-and-Collaboration-2024PackageOptions-All.md",
  "Harmony-SASE-Datasheet.md",
  "GravityZone-Cloud-MSP-Security-Datasheet.md",
  "Keeper-MSP-Data-Sheet-EN.md",
  "Keeper-MSP-Data-Sheet-FR.md",
  "nordpass_sherweb_msp_product_brochure.md",
  "nordpass_sherweb_msp_product_brochure_fr.md",
  "nordlayer_partner_onepager.md",
  "Proofpoint-Essentials-Encryption-Customer-Datasheet.md",
  "dropsuite_datasheet_entra_backup_msp_en.md",
  "dropsuite_datasheet_entra_backup_msp_fr.md",
  "veeam_sw_backup_m365_product_overview.md",
  "veeam_sw_backup_m365_product_overview_fr.md",
  "Sherweb_Rewst_RewstOverview.md",
  "sherweb-your-value-added-cloud-solutions-provider-fr.md",
  "the-cloud-solution-provider-guide.md",
];

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function langOf(filename: string): "EN" | "FR" {
  return /(_fr|-fr|-FR|_Fr)(\.|[-_])|FR-FR|french/i.test(filename) ? "FR" : "EN";
}

/** Titre lisible dérivé du nom de fichier. */
function titleOf(filename: string): string {
  return filename
    .replace(/\.md$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b(EN|FR|US|V\d|GL|SW)\b/gi, "")
    .trim();
}

/** Nettoyage léger de l'OCR : commentaires de page, H1 de nom de fichier, espaces. */
function clean(md: string): string {
  return md
    .replace(/<!--\s*page\s*\d+\s*-->/gi, "")
    .replace(/^#\s+.*$/m, "") // 1er H1 (= nom de fichier)
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Découpe en chunks ~MAX_CHARS sur les frontières de paragraphe. */
function chunkText(text: string): string[] {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if (buf && buf.length + p.length + 2 > MAX_CHARS) {
      chunks.push(buf.trim());
      buf = "";
    }
    buf += (buf ? "\n\n" : "") + p;
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.filter((c) => c.length >= MIN_CHARS);
}

async function main() {
  if (!existsSync(DOCS_DIR)) {
    throw new Error(`DOCS_DIR introuvable: ${DOCS_DIR} (copies-y les .md curés)`);
  }

  console.log("→ Purge des chunks product_doc (idempotent)…");
  {
    const { error } = await supabase.from("knowledge_chunks").delete().eq("category", CATEGORY);
    if (error) console.error("  ✗ purge:", error.message);
  }

  let total = 0;
  for (const file of ALLOWLIST) {
    const path = join(DOCS_DIR, file);
    if (!existsSync(path)) {
      console.warn(`  ⚠ absent, ignoré: ${file}`);
      continue;
    }
    const lang = langOf(file);
    const product = titleOf(file);
    const chunks = chunkText(clean(readFileSync(path, "utf8")));
    let i = 0;
    for (const content of chunks) {
      i++;
      const title = `[${product} · ${lang}] (${i}/${chunks.length})`;
      const embedding = await embed(`${product}\n\n${content}`);
      const { error } = await supabase.from("knowledge_chunks").insert({
        category: CATEGORY,
        title,
        content,
        embedding,
      });
      if (error) console.error(`  ✗ ${title}:`, error.message);
      else total++;
    }
    console.log(`  ✓ ${file} → ${chunks.length} chunk(s) [${lang}]`);
  }

  console.log(`✅ Ingestion terminée : ${total} chunks product_doc.`);
}

main().catch((e) => {
  console.error("Ingestion failed:", e);
  process.exit(1);
});
