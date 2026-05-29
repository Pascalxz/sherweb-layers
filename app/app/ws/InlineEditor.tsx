"use client";

import { useEffect, useRef, useState } from "react";
import grapesjs, { type Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import { getSherwebBlocks } from "@/lib/components/grapesBlocks";

const CANVAS_SCRIPTS = ["https://cdn.tailwindcss.com", "/canvas-tailwind.js"];
const CANVAS_STYLES = [
  "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
];

// Éditeur GrapesJS embarqué dans le Canvas in-shell (onglet Édition visuelle).
export default function InlineEditor({
  generationId,
  initialHtml,
  onSaved,
}: {
  generationId: string;
  initialHtml: string;
  onSaved?: (html: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;
    const editor = grapesjs.init({
      container: containerRef.current,
      height: "100%",
      width: "auto",
      fromElement: false,
      storageManager: false,
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

  async function save() {
    const editor = editorRef.current;
    if (!editor) return;
    setStatus("saving");
    const html = editor.getHtml();
    const css = (editor.getCss() ?? "").trim();
    const editedHtml = css ? `${html}\n<style>${css}</style>` : html;
    try {
      const res = await fetch(`/api/generations/${generationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editedHtml }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("saved");
      onSaved?.(editedHtml);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 14px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--sw-white)",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--sw-slate-500)", fontWeight: 600 }}>
          Édition visuelle — glissez des composants de marque, cliquez pour éditer
        </span>
        {status === "saved" && <span style={{ fontSize: 12, color: "#1F8A5B", marginLeft: "auto" }}>Sauvegardé ✓</span>}
        {status === "error" && <span style={{ fontSize: 12, color: "var(--sw-red-600)", marginLeft: "auto" }}>Échec</span>}
        <button
          className="btn btn-brand"
          onClick={save}
          disabled={status === "saving"}
          style={{ marginLeft: status === "idle" ? "auto" : 0, padding: "7px 13px", fontSize: 13 }}
        >
          <i className="fa-solid fa-floppy-disk"></i>
          {status === "saving" ? "Sauvegarde…" : "Sauvegarder"}
        </button>
      </div>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}
