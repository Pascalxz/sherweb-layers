"use client";

import { useEffect, useState } from "react";
import { STAGES, roleForStatus, roleMeta, stageDef, type Role, type Status } from "@/lib/workflow";

interface Review {
  id: string;
  stage: string;
  action: string;
  role: string | null;
  comment: string | null;
  email: string;
  created_at: string;
}

const PIPELINE = STAGES.map((s) => s.status); // ordre

export default function WorkflowBar({
  generationId,
  initialStatus,
  myRoles,
  isOwner,
}: {
  generationId: string;
  initialStatus: Status;
  myRoles: Role[];
  isOwner: boolean;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/workflow/${generationId}`);
    if (res.ok) {
      const d = await res.json();
      setStatus(d.status);
      setReviews(d.reviews ?? []);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationId]);

  const required: Role | null = roleForStatus(status);
  const canAct =
    !required || myRoles.includes(required) || myRoles.includes("admin") || (required === "requester" && isOwner);

  async function act(action: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/workflow/${generationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: comment.trim() || undefined }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? `Erreur ${res.status}`);
      if (action !== "comment") setStatus(d.status);
      setComment("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Échec.");
    } finally {
      setBusy(false);
    }
  }

  // index courant dans le pipeline (corrections = avant text_review)
  const curIdx = status === "corrections" ? 0 : PIPELINE.indexOf(status);

  const reviewStages: Status[] = ["text_review", "design_review", "code_review", "qa", "requester_validation"];
  const requiredLabel = required ? roleMeta(required)?.label : null;

  return (
    <div className="wf">
      <div className="wf-pipe">
        {STAGES.map((s, i) => {
          const done = i < curIdx || status === "published";
          const cur = s.status === status;
          return (
            <div key={s.status} className={"wf-step" + (cur ? " cur" : "") + (done ? " done" : "")}>
              <span className="wf-dot">
                <i className={"fa-solid " + (done ? "fa-check" : s.icon)}></i>
              </span>
              <span className="wf-lbl">{s.short}</span>
              {i < STAGES.length - 1 && <span className="wf-line"></span>}
            </div>
          );
        })}
        {status === "corrections" && <span className="wf-corr">⟲ Corrections demandées</span>}
      </div>

      <div className="wf-act">
        {!canAct && required && (
          <span className="wf-need">
            <i className="fa-solid fa-lock"></i> Rôle « {requiredLabel} » requis
          </span>
        )}
        {(status === "draft" || status === "corrections") && (
          <button className="btn btn-brand" disabled={!canAct || busy} onClick={() => act("submit")}>
            <i className="fa-solid fa-paper-plane"></i> Soumettre au workflow
          </button>
        )}
        {reviewStages.includes(status) && (
          <>
            <button className="btn btn-brand" disabled={!canAct || busy} onClick={() => act("approve")}>
              <i className="fa-solid fa-check"></i> Approuver — {stageDef(status)?.short}
            </button>
            <button className="btn btn-ghost" disabled={!canAct || busy} onClick={() => act("reject")}>
              <i className="fa-solid fa-rotate-left"></i> Renvoyer en corrections
            </button>
          </>
        )}
        {status === "ready_dev" && (
          <button className="btn btn-red" disabled={!canAct || busy} onClick={() => act("ship")}>
            <i className="fa-solid fa-rocket"></i> Envoyer en prod
          </button>
        )}
        {status === "published" && (
          <span className="wf-need" style={{ color: "#1F8A5B" }}>
            <i className="fa-solid fa-circle-check"></i> Publié en production
          </span>
        )}
      </div>

      <div className="wf-feed">
        <div className="wf-comment">
          <input
            className="filt-select"
            style={{ flex: 1 }}
            placeholder="Laisser un retour / commentaire…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="btn btn-ghost" disabled={busy || !comment.trim()} onClick={() => act("comment")}>
            Commenter
          </button>
        </div>
        {err && <p style={{ color: "var(--sw-red-600)", fontSize: 12, margin: "4px 0 0" }}>{err}</p>}
        {reviews.length > 0 && (
          <ul className="wf-reviews">
            {reviews.slice().reverse().map((r) => (
              <li key={r.id}>
                <span className={"wf-rev-act " + r.action}>
                  {r.action === "approve" ? "✓ approuvé" : r.action === "reject" ? "⟲ corrections" : r.action === "submit" ? "→ soumis" : r.action === "ship" ? "🚀 prod" : "💬"}
                </span>
                <span className="wf-rev-who">{r.email}</span>
                {r.role && <span className="wf-rev-role">{roleMeta(r.role)?.label ?? r.role}</span>}
                <span className="wf-rev-stage">{stageDef(r.stage)?.short ?? r.stage}</span>
                {r.comment && <span className="wf-rev-cmt">« {r.comment} »</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
