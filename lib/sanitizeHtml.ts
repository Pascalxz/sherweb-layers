// sanitizeHtml.ts — nettoyage léger de la sortie modèle avant persistance.
// Le system prompt demande du HTML nu (composants only), mais on se protège
// contre un éventuel fence ``` ou un préambule, sans réécrire le markup.

export function extractHtml(raw: string): string {
  let html = raw.trim();

  // Retire un éventuel bloc de code ```html ... ``` ou ``` ... ```.
  const fence = html.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence) html = fence[1].trim();

  // Coupe tout préambule avant le premier composant (<section ...> ou <footer ...>).
  const start = html.search(/<(section|footer)\b/i);
  if (start > 0) html = html.slice(start);

  // Coupe tout suffixe après le dernier </section> ou </footer>.
  const lastSection = html.lastIndexOf("</section>");
  const lastFooter = html.lastIndexOf("</footer>");
  const end = Math.max(lastSection + "</section>".length, lastFooter + "</footer>".length);
  if (end > 0 && end < html.length) html = html.slice(0, end);

  return html.trim();
}
