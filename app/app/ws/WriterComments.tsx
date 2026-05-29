"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

export default function WriterComments({
  generationId,
  html,
  currentUserId,
}: {
  generationId: string;
  html: string;
  currentUserId: string;
}) {
  // Extraire le texte (le rédacteur voit la copie, pas le design).
  const segs = useMemo(() => {
    if (typeof window === "undefined") return [] as { tag: string; text: string }[];
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("h1,h2,h3,p,li,a"))
      .map((el) => ({ tag: el.tagName.toLowerCase(), text: (el.textContent ?? "").trim() }))
      .filter((s) => s.text.length > 0);
  }, [html]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [pending, setPending] = useState<{ seg: number; quote: string; x: number; y: number } | null>(null);
  const [composing, setComposing] = useState<{ seg: number; quote: string } | null>(null);
  const [draft, setDraft] = useState("");
  const docRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/comments?generationId=${generationId}`);
    if (res.ok) setComments((await res.json()).comments ?? []);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationId]);

  function onMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setPending(null);
      return;
    }
    let node = sel.anchorNode as HTMLElement | null;
    while (node && node.nodeType === 3) node = node.parentElement;
    let segEl: HTMLElement | null = node;
    while (segEl && !segEl.dataset?.seg) segEl = segEl.parentElement;
    if (!segEl || !docRef.current?.contains(segEl)) {
      setPending(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setPending({ seg: Number(segEl.dataset.seg), quote: sel.toString().trim().slice(0, 300), x: rect.left + rect.width / 2, y: rect.top });
  }

  async function save() {
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
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: !c.resolved }),
    });
  }
  async function remove(c: Comment) {
    setComments((cs) => cs.filter((x) => x.id !== c.id));
    await fetch(`/api/comments/${c.id}`, { method: "DELETE" });
  }

  function segHtml(text: string, segIndex: number) {
    let out = escapeHtml(text);
    const quotes = comments.filter((c) => c.seg_index === segIndex && !c.resolved && c.quote).map((c) => c.quote as string);
    for (const q of quotes) {
      const eq = escapeHtml(q);
      if (out.includes(eq)) out = out.replace(eq, `<mark>${eq}</mark>`);
    }
    return out;
  }

  const openCount = comments.filter((c) => !c.resolved).length;

  return (
    <div className="wc" onMouseUp={onMouseUp}>
      <div className="wc-doc-pad">
        <div className="wc-doc" ref={docRef}>
          {segs.map((s, i) => {
            const annotated = comments.some((c) => c.seg_index === i && !c.resolved);
            const Tag = (["h1", "h2", "h3", "li", "a"].includes(s.tag) ? s.tag : "p") as keyof JSX.IntrinsicElements;
            return (
              <Tag
                key={i}
                data-seg={i}
                className={"wc-seg " + s.tag + (annotated ? " annotated" : "")}
                dangerouslySetInnerHTML={{ __html: segHtml(s.text, i) }}
              />
            );
          })}
          {segs.length === 0 && <p className="wc-seg p">Aucun texte à commenter.</p>}
        </div>
      </div>

      {pending && (
        <div className="wc-pop" style={{ left: pending.x, top: pending.y - 44, transform: "translateX(-50%)" }}>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setComposing({ seg: pending.seg, quote: pending.quote });
              setPending(null);
            }}
          >
            <i className="fa-solid fa-comment-medical"></i> Commenter
          </button>
        </div>
      )}

      <div className="wc-side">
        <div className="wc-side-h">
          <i className="fa-solid fa-comments"></i> Commentaires · {openCount} ouvert{openCount > 1 ? "s" : ""}
        </div>
        <div className="wc-comment-list">
          {comments.length === 0 && !composing && (
            <div className="wc-empty">Sélectionnez un passage dans le texte pour le commenter — comme dans Word.</div>
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
                  <button className="wc-mini" onClick={() => remove(c)} title="Supprimer">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {composing && (
          <div className="wc-composer">
            <div className="wc-q">« {composing.quote} »</div>
            <textarea
              autoFocus
              placeholder="Votre commentaire…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn btn-brand" onClick={save} disabled={!draft.trim()}>
                Commenter
              </button>
              <button className="btn btn-ghost" onClick={() => { setComposing(null); setDraft(""); }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
