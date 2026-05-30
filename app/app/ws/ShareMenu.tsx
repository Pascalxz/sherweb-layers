"use client";

import { useState } from "react";

export default function ShareMenu({ generationId, canManage }: { generationId: string; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"public" | "internal" | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const internalLink = `${origin}/app/canvas/${generationId}`;
  const publicLink = token ? `${origin}/share/${token}` : null;

  async function createLink() {
    setBusy(true);
    const res = await fetch(`/api/share/${generationId}`, { method: "POST" });
    if (res.ok) setToken((await res.json()).token);
    setBusy(false);
  }
  async function revoke() {
    setBusy(true);
    const res = await fetch(`/api/share/${generationId}`, { method: "DELETE" });
    if (res.ok) setToken(null);
    setBusy(false);
  }
  function copy(text: string, which: "public" | "internal") {
    navigator.clipboard?.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="share-wrap">
      <button className="btn btn-ghost" style={{ padding: "9px 13px", fontSize: 13 }} onClick={() => setOpen((v) => !v)}>
        <i className="fa-solid fa-share-nodes"></i> Partager
      </button>
      {open && (
        <div className="share-pop">
          <div className="share-sec">
            <div className="share-h">
              <i className="fa-solid fa-users"></i> Lien interne (équipe)
            </div>
            <p className="share-sub">Ouvre le Canvas complet — connexion requise.</p>
            <div className="share-row">
              <input readOnly value={internalLink} onFocus={(e) => e.target.select()} />
              <button className="btn btn-brand" onClick={() => copy(internalLink, "internal")}>
                {copied === "internal" ? "Copié ✓" : "Copier"}
              </button>
            </div>
          </div>

          <div className="share-sec" style={{ borderTop: "1px solid var(--color-border)" }}>
            <div className="share-h">
              <i className="fa-solid fa-globe"></i> Lien public (lecture seule)
            </div>
            <p className="share-sub">Aperçu on-brand sans connexion. Révocable à tout moment.</p>
            {!publicLink ? (
              <button className="btn btn-brand" disabled={busy || !canManage} onClick={createLink} style={{ width: "100%" }}>
                <i className="fa-solid fa-link"></i> {busy ? "Création…" : "Créer un lien public"}
              </button>
            ) : (
              <>
                <div className="share-row">
                  <input readOnly value={publicLink} onFocus={(e) => e.target.select()} />
                  <button className="btn btn-brand" onClick={() => copy(publicLink, "public")}>
                    {copied === "public" ? "Copié ✓" : "Copier"}
                  </button>
                </div>
                <button className="share-revoke" disabled={busy} onClick={revoke}>
                  <i className="fa-solid fa-ban"></i> Révoquer le lien public
                </button>
              </>
            )}
            {!canManage && <p className="share-sub" style={{ color: "var(--sw-red-600)" }}>Réservé au propriétaire ou admin.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
