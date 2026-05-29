"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import grapesjs, { type Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import { getSherwebBlocks } from "@/lib/components/grapesBlocks";

// Tailwind CDN + tokens Sherweb injectés DANS l'iframe du canvas (cf. public/canvas-tailwind.js),
// pour que les classes du HTML généré s'affichent à l'identique.
const CANVAS_SCRIPTS = ["https://cdn.tailwindcss.com", "/canvas-tailwind.js"];
const CANVAS_STYLES = [
  "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function CanvasEditor({
  generationId,
  initialHtml,
}: {
  generationId: string;
  initialHtml: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: "100%",
      width: "auto",
      fromElement: false,
      storageManager: false, // sauvegarde manuelle via notre API
      components: initialHtml,
      canvas: { scripts: CANVAS_SCRIPTS, styles: CANVAS_STYLES },
      blockManager: { blocks: getSherwebBlocks() },
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, [initialHtml]);

  function showCode() {
    editorRef.current?.runCommand("export-template");
  }

  async function save() {
    const editor = editorRef.current;
    if (!editor) return;
    setStatus("saving");
    setError(null);

    const html = editor.getHtml();
    const css = editor.getCss() ?? "";
    // Les classes Tailwind restent dans le markup ; on n'ajoute le CSS du Style Manager
    // que s'il a généré des règles (édition de styles ponctuelle).
    const editedHtml = css.trim() ? `${html}\n<style>${css}</style>` : html;

    try {
      const res = await fetch(`/api/generations/${generationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editedHtml }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      setStatus("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
      setStatus("error");
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between gap-4 px-5 py-3 border-b border-sherweb-border bg-white shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/app" className="text-sm text-sherweb-muted hover:text-sherweb-heading">
            ← Retour
          </Link>
          <span className="text-sm uppercase tracking-button text-sherweb-muted">
            Canvas · édition on-brand
          </span>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" && <span className="text-sm text-sherweb-primary">Sauvegardé ✓</span>}
          {status === "error" && <span className="text-sm text-sherweb-accent">{error}</span>}
          <button onClick={showCode} className="btn-secondary">
            Voir le code
          </button>
          <button onClick={save} disabled={status === "saving"} className="btn-primary disabled:opacity-50">
            {status === "saving" ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </header>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
