"use client";

import { useEffect, useRef, useState } from "react";
import { wordDiff } from "@/lib/wordDiff";

interface TrackChange {
  id: string;
  seg_index: number;
  original: string;
  proposed: string;
  status: "pending" | "accepted" | "rejected";
  email: string;
}

interface Comment {
  id: string;
  seg_index: number;
  quote: string | null;
  body: string;
  email: string;
  resolved: boolean;
  user_id: string;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
const renderTag = (t: string) => (["h1", "h2", "h3"].includes(t) ? t : "p");

export default function WriterComments({
  generationId,
  html,
  currentUserId,
  canEdit,
  onSaved,
}: {
  generationId: string;
  html: string;
  currentUserId: string;
  canEdit: boolean;
  onSaved?: (html: string) => void;
}) {
  const edRef = useRef<HTMLDivElement>(null);
  const origDocRef = useRef<Document | null>(null);
  const origElsRef = useRef<Element[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [pending, setPending] = useState<{ seg: number; quote: string; x: number; y: number } | null>(null);
  const [composing, setComposing] = useState<{ seg: number; quote: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "dirty" | "proposed">("idle");
  const origTextsRef = useRef<string[]>([]);
  const [track, setTrack] = useState(false);
  const [changes, setChanges] = useState<TrackChange[]>([]);

  // Initialise le document éditable UNE fois (sinon le curseur saute).
  useEffect(() => {
    if (typeof window === "undefined" || !edRef.current) return;
    const doc = new DOMParser().parseFromString(html, "text/html");
    const els = Array.from(doc.querySelectorAll("h1,h2,h3,p,li,a"));
    origDocRef.current = doc;
    origElsRef.current = els;
    origTextsRef.current = els.map((el) => (el.textContent ?? "").trim());
    loadChanges();
    // Charge les commentaires puis construit le HTML éditable avec surlignage best-effort.
    (async () => {
      let loaded: Comment[] = [];
      const res = await fetch(`/api/comments?generationId=${generationId}`);
      if (res.ok) loaded = (await res.json()).comments ?? [];
      setComments(loaded);
      const segHtml = els
        .map((el, i) => {
          const text = (el.textContent ?? "").trim();
          let inner = escapeHtml(text);
          for (const c of loaded.filter((c) => c.seg_index === i && !c.resolved && c.quote)) {
            const eq = escapeHtml(c.quote as string);
            if (inner.includes(eq)) inner = inner.replace(eq, `<span class="wc-hl">${eq}</span>`);
          }
          return `<${renderTag(el.tagName.toLowerCase())} data-seg="${i}" class="wc-seg ${el.tagName.toLowerCase()}">${inner || "&nbsp;"}</${renderTag(el.tagName.toLowerCase())}>`;
        })
        .join("");
      if (edRef.current) edRef.current.innerHTML = segHtml || "<p class='wc-seg p'>Aucun texte.</p>";
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationId]);

  function onMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return setPending(null);
    let node = sel.anchorNode as HTMLElement | null;
    while (node && node.nodeType === 3) node = node.parentElement;
    let segEl: HTMLElement | null = node;
    while (segEl && !segEl.dataset?.seg) segEl = segEl.parentElement;
    if (!segEl || !edRef.current?.contains(segEl)) return setPending(null);
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setPending({ seg: Number(segEl.dataset.seg), quote: sel.toString().trim().slice(0, 300), x: rect.left + rect.width / 2, y: rect.top });
  }

  function startComment() {
    if (!pending) return;
    // Surligne la sélection courante (façon Word) sans re-render React.
    const sel = window.getSelection();
    try {
      if (sel && !sel.isCollapsed) {
        const span = document.createElement("span");
        span.className = "wc-hl";
        sel.getRangeAt(0).surroundContents(span);
        sel.removeAllRanges();
      }
    } catch {
      /* sélection multi-éléments : on garde quand même le commentaire */
    }
    setComposing({ seg: pending.seg, quote: pending.quote });
    setPending(null);
  }

  async function saveComment() {
    if (!composing || !draft.trim()) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, segIndex: composing.seg, quote: composing.quote, body: draft }),
    });
    if (res.ok) {
      const d = await res.json();
      setComments((c) => [...c, d.comment]);
      setDraft("");
      setComposing(null);
    }
  }
  async function toggleResolved(c: Comment) {
    setComments((cs) => cs.map((x) => (x.id === c.id ? { ...x, resolved: !x.resolved } : x)));
    await fetch(`/api/comments/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resolved: !c.resolved }),
    });
  }
  async function remove(c: Comment) {
    setComments((cs) => cs.filter((x) => x.id !== c.id));
    await fetch(`/api/comments/${c.id}`, { method: "DELETE" });
  }

  // ── Track changes ──
  async function loadChanges() {
    const res = await fetch(`/api/changes?generationId=${generationId}`);
    if (res.ok) setChanges((await res.json()).changes ?? []);
  }
  // Calcule les diffs par segment (texte courant vs original) et les propose.
  async function propose() {
    const ed = edRef.current;
    if (!ed) return;
    const edits: { segIndex: number; original: string; proposed: string }[] = [];
    ed.querySelectorAll("[data-seg]").forEach((node) => {
      const i = Number((node as HTMLElement).dataset.seg);
      const proposed = (node.textContent ?? "").trim();
      const original = origTextsRef.current[i] ?? "";
      if (proposed !== original) edits.push({ segIndex: i, original, proposed });
    });
    if (edits.length === 0) {
      setSaveState("idle");
      return;
    }
    setSaveState("saving");
    const res = await fetch("/api/changes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generationId, edits }),
    });
    if (res.ok) {
      setSaveState("proposed");
      await loadChanges();
    } else {
      setSaveState("dirty");
    }
  }
  async function resolveChange(c: TrackChange, action: "accept" | "reject") {
    setChanges((cs) => cs.map((x) => (x.id === c.id ? { ...x, status: action === "accept" ? "accepted" : "rejected" } : x)));
    const res = await fetch(`/api/changes/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok && action === "accept") {
      // Le serveur a appliqué le texte au edited_html ; on reflète localement le segment.
      origTextsRef.current[c.seg_index] = c.proposed;
      const node = edRef.current?.querySelector(`[data-seg="${c.seg_index}"]`);
      if (node) node.textContent = c.proposed;
    }
  }

  // Sauvegarde du TEXTE édité → réinjecte dans le HTML d'origine → PATCH.
  async function saveDoc() {
    const doc = origDocRef.current, els = origElsRef.current, ed = edRef.current;
    if (!doc || !ed) return;
    setSaveState("saving");
    ed.querySelectorAll("[data-seg]").forEach((node) => {
      const i = Number((node as HTMLElement).dataset.seg);
      if (els[i]) els[i].textContent = (node.textContent ?? "").trim();
    });
    const newHtml = doc.body.innerHTML;
    try {
      const res = await fetch(`/api/generations/${generationId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ editedHtml: newHtml }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSaveState("saved");
      onSaved?.(newHtml);
    } catch {
      setSaveState("dirty");
    }
  }

  const openCount = comments.filter((c) => !c.resolved).length;
  const pendingChanges = changes.filter((c) => c.status === "pending");

  function renderDiff(original: string, proposed: string): string {
    return wordDiff(original, proposed)
      .map((op) =>
        op.type === "eq"
          ? escapeHtml(op.text)
          : op.type === "del"
            ? `<del>${escapeHtml(op.text)}</del>`
            : `<ins>${escapeHtml(op.text)}</ins>`,
      )
      .join("");
  }

  return (
    <div className="wc" onMouseUp={onMouseUp}>
      <div className="wc-main">
        <div className="wc-toolbar">
          <span className="wc-tb-name"><i className="fa-solid fa-file-word" style={{ color: "#2B579A" }}></i> Document — copie</span>
          {canEdit ? (
            <>
              <button
                className={"wc-track-toggle" + (track ? " on" : "")}
                onClick={() => setTrack((v) => !v)}
                title="Suivi des modifications"
              >
                <i className={"fa-solid " + (track ? "fa-toggle-on" : "fa-toggle-off")}></i> Suivi des modifications
              </button>
              <span className="wc-tb-state">
                {saveState === "saving"
                  ? "Envoi…"
                  : saveState === "saved"
                    ? "Enregistré ✓"
                    : saveState === "proposed"
                      ? "Modifications proposées ✓"
                      : saveState === "dirty"
                        ? "Modifié"
                        : track
                          ? "Mode suggestion"
                          : "Éditable"}
              </span>
              {track ? (
                <button className="btn btn-brand" style={{ padding: "7px 13px", fontSize: 13 }} onClick={propose} disabled={saveState === "saving"}>
                  <i className="fa-solid fa-code-compare"></i> Proposer les modifications
                </button>
              ) : (
                <button className="btn btn-brand" style={{ padding: "7px 13px", fontSize: 13 }} onClick={saveDoc} disabled={saveState === "saving"}>
                  <i className="fa-solid fa-floppy-disk"></i> Enregistrer le texte
                </button>
              )}
            </>
          ) : (
            <span className="wc-tb-state"><i className="fa-solid fa-lock"></i> Lecture seule (rôle rédacteur requis pour éditer)</span>
          )}
        </div>
        <div className="wc-doc-pad">
          <div
            className="wc-doc wc-editable"
            ref={edRef}
            contentEditable={canEdit}
            suppressContentEditableWarning
            spellCheck
            onInput={() => setSaveState("dirty")}
          />
        </div>
      </div>

      {pending && (
        <div className="wc-pop" style={{ left: pending.x, top: pending.y - 44, transform: "translateX(-50%)" }}>
          <button onMouseDown={(e) => { e.preventDefault(); startComment(); }}>
            <i className="fa-solid fa-comment-medical"></i> Commenter
          </button>
        </div>
      )}

      <div className="wc-side">
        {pendingChanges.length > 0 && (
          <div className="wc-changes">
            <div className="wc-side-h"><i className="fa-solid fa-code-compare" style={{ color: "var(--sw-red-600)" }}></i> Modifications suivies · {pendingChanges.length}</div>
            {pendingChanges.map((c) => (
              <div key={c.id} className="wc-change">
                <div className="wc-diff" dangerouslySetInnerHTML={{ __html: renderDiff(c.original, c.proposed) }} />
                <div className="wc-foot">
                  <span className="wc-who">{c.email}</span>
                  {canEdit && (
                    <>
                      <button className="wc-mini wc-accept" onClick={() => resolveChange(c, "accept")} title="Accepter">
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button className="wc-mini wc-reject" onClick={() => resolveChange(c, "reject")} title="Refuser">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="wc-side-h"><i className="fa-solid fa-comments"></i> Commentaires · {openCount} ouvert{openCount > 1 ? "s" : ""}</div>
        <div className="wc-comment-list">
          {comments.length === 0 && !composing && (
            <div className="wc-empty">Sélectionnez un passage → « Commenter » (comme dans Word). Le rédacteur peut aussi éditer le texte directement.</div>
          )}
          {comments.map((c) => (
            <div key={c.id} className={"wc-card" + (c.resolved ? " resolved" : "")}>
              {c.quote && <div className="wc-quote">« {c.quote} »</div>}
              <div className="wc-body">{c.body}</div>
              <div className="wc-foot">
                <span className="wc-who">{c.email}</span>
                <button className="wc-mini" onClick={() => toggleResolved(c)} title={c.resolved ? "Rouvrir" : "Résoudre"}>
                  <i className={"fa-solid " + (c.resolved ? "fa-rotate-left" : "fa-check")}></i>
                </button>
                {c.user_id === currentUserId && (
                  <button className="wc-mini" onClick={() => remove(c)} title="Supprimer"><i className="fa-solid fa-trash"></i></button>
                )}
              </div>
            </div>
          ))}
        </div>
        {composing && (
          <div className="wc-composer">
            <div className="wc-q">« {composing.quote} »</div>
            <textarea autoFocus placeholder="Votre commentaire…" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn btn-brand" onClick={saveComment} disabled={!draft.trim()}>Commenter</button>
              <button className="btn btn-ghost" onClick={() => { setComposing(null); setDraft(""); }}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
