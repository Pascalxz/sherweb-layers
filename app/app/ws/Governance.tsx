"use client";

import { useState } from "react";
import { MODULES, TONE } from "@/lib/layerData";
import type { GovCategory, GovRule } from "./types";

const CATEGORIES: GovCategory[] = ["legal", "brand", "compliance"];

export default function Governance({ initialRules }: { initialRules: GovRule[] }) {
  const [rules, setRules] = useState<GovRule[]>(initialRules);
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState<GovCategory>("brand");
  const [newRule, setNewRule] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/governance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? `Erreur ${res.status}`);
    }
  }

  async function toggle(r: GovRule) {
    setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
    try {
      await patch(r.id, { enabled: !r.enabled });
    } catch (e) {
      setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: r.enabled } : x))); // revert
      setErr(e instanceof Error ? e.message : "Échec.");
    }
  }

  async function saveText(r: GovRule, text: string) {
    if (text.trim() === r.rule || text.trim().length < 5) return;
    setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, rule: text.trim() } : x)));
    try {
      await patch(r.id, { rule: text.trim() });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Échec.");
    }
  }

  async function remove(r: GovRule) {
    const prev = rules;
    setRules((rs) => rs.filter((x) => x.id !== r.id));
    const res = await fetch(`/api/governance/${r.id}`, { method: "DELETE" });
    if (!res.ok) {
      setRules(prev);
      setErr("Suppression échouée.");
    }
  }

  async function add() {
    if (newRule.trim().length < 5) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCat, rule: newRule }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? `Erreur ${res.status}`);
      setRules((rs) => [...rs, d.rule]);
      setNewRule("");
      setAdding(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Échec.");
    } finally {
      setBusy(false);
    }
  }

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <div>
      <div className="view-head">
        <p className="view-eyebrow">Cœur du produit</p>
        <h1 className="view-title">La couche : gouvernance &amp; tone of voice</h1>
        <p className="view-sub">
          Le contexte non négociable, injecté dans chaque génération. Modifiez-le ici — toute l&apos;équipe
          sort on-brand dès le prochain prompt. {activeCount}/{rules.length} règles actives.
        </p>
        {err && <p style={{ color: "var(--sw-red-600)", fontSize: 13, marginTop: 8 }}>{err}</p>}
      </div>

      <div className="gov-grid">
        <div className="card card-pad">
          <h3 className="card-h" style={{ marginBottom: 14 }}>
            <i className="fa-solid fa-comment-dots" style={{ color: "var(--sw-blue-700)", marginRight: 8 }}></i>
            Tone of voice
          </h3>
          {(["fr", "en"] as const).map((l) => (
            <div key={l} className="tov-block">
              <span className="tov-lang">{l.toUpperCase()}</span>
              <p>{TONE[l]}</p>
            </div>
          ))}
        </div>

        <div className="card card-pad">
          <h3 className="card-h" style={{ marginBottom: 14, display: "flex", alignItems: "center" }}>
            <i className="fa-solid fa-scale-balanced" style={{ color: "var(--sw-red-600)", marginRight: 8 }}></i>
            Règles de gouvernance · {rules.length}
            <button
              className="btn btn-ghost"
              style={{ marginLeft: "auto", padding: "6px 11px", fontSize: 12 }}
              onClick={() => setAdding((v) => !v)}
            >
              <i className="fa-solid fa-plus"></i> Ajouter
            </button>
          </h3>

          {adding && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "8px 0 14px" }}>
              <select className="filt-select" value={newCat} onChange={(e) => setNewCat(e.target.value as GovCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <textarea
                className="prompt-box"
                style={{ minHeight: 64, fontSize: 13 }}
                placeholder="Nouvelle règle non négociable…"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-brand" disabled={busy} onClick={add}>
                  {busy ? "Ajout…" : "Enregistrer"}
                </button>
                <button className="btn btn-ghost" onClick={() => setAdding(false)}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          <div className="gov-rules">
            {rules.map((r) => (
              <div key={r.id} className="gov-rule" style={{ opacity: r.enabled ? 1 : 0.5 }}>
                <span className={"cv-cat " + r.category}>{r.category}</span>
                <textarea
                  defaultValue={r.rule}
                  onBlur={(e) => saveText(r, e.target.value)}
                  rows={2}
                  style={{
                    flex: 1,
                    border: "1px solid transparent",
                    borderRadius: 8,
                    padding: "4px 8px",
                    font: "inherit",
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "var(--sw-ink-700)",
                    resize: "vertical",
                    background: "transparent",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                />
                <button
                  onClick={() => toggle(r)}
                  title={r.enabled ? "Désactiver" : "Activer"}
                  style={{
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 18,
                    color: r.enabled ? "#1F8A5B" : "var(--sw-slate-300)",
                  }}
                >
                  <i className={"fa-solid " + (r.enabled ? "fa-toggle-on" : "fa-toggle-off")}></i>
                </button>
                <button
                  onClick={() => remove(r)}
                  title="Supprimer"
                  style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: 13, color: "var(--sw-slate-400)" }}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h3 className="section-h">Modules de contexte · {MODULES.length}</h3>
      <div className="mod-grid">
        {MODULES.map((m) => (
          <div key={m.id} className="mod-card">
            <div className="mod-ico">
              <i className={"fa-solid " + m.icon}></i>
            </div>
            <div className="mod-name">{m.label}</div>
            <div className="mod-sub">{m.sub}</div>
            <span className={"mod-state" + (m.live ? " live" : "")}>{m.live ? "Actif (live)" : "Configuré"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
