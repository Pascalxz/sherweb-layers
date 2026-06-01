"use client";

import { useState } from "react";

const EXAMPLES = [
  "Raccourcis le 2e paragraphe de 10 %",
  "Rends le titre plus percutant",
  "Ajoute une preuve chiffrée officielle dans l'intro",
  "Reformule les CTA pour qu'ils soient plus directs",
];

export default function RevisePanel({
  generationId,
  canEdit,
  onRevised,
}: {
  generationId: string;
  canEdit: boolean;
  onRevised: (html: string) => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function revise() {
    if (instruction.trim().length < 3 || busy) return;
    setBusy(true);
    setErr(null);
    setDone(false);
    try {
      const res = await fetch(`/api/generations/${generationId}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? `Erreur ${res.status}`);
      onRevised(d.html);
      setDone(true);
      setInstruction("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Échec de la correction.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="revise card card-pad">
      <span className="field-lbl">Demande de corrections</span>
      <textarea
        className="prompt-box"
        style={{ minHeight: 150 }}
        placeholder="Ex. : Raccourcis le 2e paragraphe de 10 %, rends le titre plus percutant…"
        value={instruction}
        disabled={busy || !canEdit}
        onChange={(e) => setInstruction(e.target.value)}
      />
      <div className="chips" style={{ marginTop: 10 }}>
        {EXAMPLES.map((ex, i) => (
          <button key={i} className="chip" disabled={busy || !canEdit} onClick={() => setInstruction(ex)}>
            {ex.length > 38 ? ex.slice(0, 36) + "…" : ex}
          </button>
        ))}
      </div>

      <button className="gen-btn" onClick={revise} disabled={busy || !canEdit || instruction.trim().length < 3}>
        {busy ? (
          <>
            <span className="spin"></span>Correction on-brand…
          </>
        ) : (
          <>
            <i className="fa-solid fa-wand-magic-sparkles"></i>Demander une correction
          </>
        )}
      </button>

      {done && (
        <p style={{ color: "#1F8A5B", fontSize: 13, marginTop: 12 }}>
          <i className="fa-solid fa-circle-check"></i> Correction appliquée par la couche.
        </p>
      )}
      {err && <p style={{ color: "var(--sw-red-600)", fontSize: 13, marginTop: 12 }}>{err}</p>}
      {!canEdit && (
        <p style={{ color: "var(--sw-slate-400)", fontSize: 12, marginTop: 10 }}>
          <i className="fa-solid fa-lock"></i> Réservé aux rôles éditeurs.
        </p>
      )}

      <p className="revise-note">
        <i className="fa-solid fa-layer-group" style={{ color: "var(--sw-blue-700)" }}></i> La correction repasse par
        la couche Sherweb — tone of voice, design tokens et gouvernance restent appliqués.
      </p>
    </div>
  );
}
