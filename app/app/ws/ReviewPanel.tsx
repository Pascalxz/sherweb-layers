"use client";

import { useEffect, useRef, useState } from "react";
import { renderDocument } from "@/lib/components/htmlLibrary";

export type ReviewKind = "design" | "code" | "qa";
const SEG: Record<ReviewKind, number> = { design: -1, code: -2, qa: -3 };

interface Note {
  id: string;
  seg_index: number;
  quote: string | null;
  body: string;
  email: string;
  resolved: boolean;
  user_id: string;
}

const LABELS: Record<ReviewKind, { title: string; icon: string; notesLabel: string }> = {
  design: { title: "Revue design", icon: "fa-pen-ruler", notesLabel: "Notes design" },
  code: { title: "Revue code", icon: "fa-code", notesLabel: "Notes intégration" },
  qa: { title: "Contrôle QA", icon: "fa-clipboard-check", notesLabel: "Notes QA" },
};

const QA_CHECKS = [
  "Couleurs de la palette uniquement (rouge réservé aux CTA)",
  "Deux niveaux de CTA présents (fort + doux)",
  "Proof points officiels uniquement, aucun chiffre inventé",
  "Casse phrase, aucun emoji",
  "Bilingue cohérent (registre québécois si FR)",
];

export default function ReviewPanel({
  generationId,
  html,
  currentUserId,
  kind,
  canEdit,
  onEditDesign,
  onSavedCode,
}: {
  generationId: string;
  html: string;
  currentUserId: string;
  kind: ReviewKind;
  canEdit: boolean;
  onEditDesign?: () => void;
  onSavedCode?: (html: string) => void;
}) {
  const seg = SEG[kind];
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [code, setCode] = useState(html);
  const [codeState, setCodeState] = useState<"idle" | "saving" | "saved" | "dirty">("idle");
  const [checks, setChecks] = useState<boolean[]>(QA_CHECKS.map(() => false));
  const composerRef = useRef<HTMLTextAreaElement>(null);

  async function load() {
    const res = await fetch(`/api/comments?generationId=${generationId}`);
    if (res.ok) setNotes(((await res.json()).comments ?? []).filter((c: Note) => c.seg_index === seg));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationId, kind]);

  async function addNote() {
    if (!draft.trim()) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, segIndex: seg, quote: LABELS[kind].title, body: draft }),
    });
    if (res.ok) {
      const d = await res.json();
      setNotes((n) => [...n, d.comment]);
      setDraft("");
    }
  }
  async function toggleResolved(c: Note) {
    setNotes((ns) => ns.map((x) => (x.id === c.id ? { ...x, resolved: !x.resolved } : x)));
    await fetch(`/api/comments/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: !c.resolved }),
    });
  }
  async function removeNote(c: Note) {
    setNotes((ns) => ns.filter((x) => x.id !== c.id));
    await fetch(`/api/comments/${c.id}`, { method: "DELETE" });
  }

  async function saveCode() {
    setCodeState("saving");
    try {
      const res = await fetch(`/api/generations/${generationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editedHtml: code }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setCodeState("saved");
      onSavedCode?.(code);
    } catch {
      setCodeState("dirty");
    }
  }

  const open = notes.filter((n) => !n.resolved).length;

  return (
    <div className="wc">
      <div className="wc-main">
        <div className="wc-toolbar">
          <span className="wc-tb-name">
            <i className={"fa-solid " + LABELS[kind].icon} style={{ color: "var(--sw-blue-700)" }}></i> {LABELS[kind].title}
          </span>
          {kind === "design" && canEdit && onEditDesign && (
            <button className="btn btn-brand" style={{ marginLeft: "auto", padding: "7px 13px", fontSize: 13 }} onClick={onEditDesign}>
              <i className="fa-solid fa-wand-magic-sparkles"></i> Éditer le design
            </button>
          )}
          {kind === "code" && canEdit && (
            <>
              <span className="wc-tb-state" style={{ marginLeft: "auto" }}>
                {codeState === "saving" ? "Sauvegarde…" : codeState === "saved" ? "Enregistré ✓" : codeState === "dirty" ? "Modifié" : "Éditable"}
              </span>
              <button className="btn btn-brand" style={{ padding: "7px 13px", fontSize: 13 }} onClick={saveCode} disabled={codeState === "saving"}>
                <i className="fa-solid fa-floppy-disk"></i> Enregistrer le code
              </button>
            </>
          )}
          {kind === "code" && !canEdit && (
            <span className="wc-tb-state" style={{ marginLeft: "auto" }}>
              <i className="fa-solid fa-lock"></i> Lecture seule
            </span>
          )}
        </div>

        {kind === "code" ? (
          <textarea
            className="cv-code"
            value={code}
            readOnly={!canEdit}
            onChange={(e) => {
              setCode(e.target.value);
              setCodeState("dirty");
            }}
          />
        ) : (
          <div className="cv-frame-pad">
            <iframe className="cv-frame" title="preview" srcDoc={renderDocument(html)} />
          </div>
        )}
      </div>

      <div className="wc-side">
        {kind === "qa" && (
          <div className="wc-changes" style={{ background: "#F6FBFF" }}>
            <div className="wc-side-h">
              <i className="fa-solid fa-list-check" style={{ color: "var(--sw-blue-700)" }}></i> Checklist QA
            </div>
            {QA_CHECKS.map((c, i) => (
              <label key={i} className="qa-check">
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={() => setChecks((cs) => cs.map((v, j) => (j === i ? !v : v)))}
                />
                <span className={checks[i] ? "done" : ""}>{c}</span>
              </label>
            ))}
          </div>
        )}
        <div className="wc-side-h">
          <i className="fa-solid fa-comments"></i> {LABELS[kind].notesLabel} · {open} ouvert{open > 1 ? "s" : ""}
        </div>
        <div className="wc-comment-list">
          {notes.length === 0 && <div className="wc-empty">Aucune note pour l&apos;instant. Ajoutez un retour ci-dessous.</div>}
          {notes.map((c) => (
            <div key={c.id} className={"wc-card" + (c.resolved ? " resolved" : "")}>
              <div className="wc-body">{c.body}</div>
              <div className="wc-foot">
                <span className="wc-who">{c.email}</span>
                <button className="wc-mini" onClick={() => toggleResolved(c)} title={c.resolved ? "Rouvrir" : "Résoudre"}>
                  <i className={"fa-solid " + (c.resolved ? "fa-rotate-left" : "fa-check")}></i>
                </button>
                {c.user_id === currentUserId && (
                  <button className="wc-mini" onClick={() => removeNote(c)} title="Supprimer">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="wc-composer">
          <textarea ref={composerRef} placeholder={`Ajouter une ${LABELS[kind].notesLabel.toLowerCase()}…`} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn btn-brand" onClick={addNote} disabled={!draft.trim()}>
              Ajouter la note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
