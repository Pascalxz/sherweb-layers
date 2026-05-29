"use client";

import dynamic from "next/dynamic";

// GrapesJS casse en SSR (piège connu CLAUDE.md) → import dynamique client-only.
const CanvasEditor = dynamic(() => import("./CanvasEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center text-sherweb-muted">
      Chargement de l'éditeur…
    </div>
  ),
});

export default function CanvasClient(props: { generationId: string; initialHtml: string }) {
  return <CanvasEditor {...props} />;
}
