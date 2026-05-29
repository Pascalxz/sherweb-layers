"use client";

import { useState } from "react";
import type { ModuleMeta } from "@/lib/layerData";
import type { GovCategory, GovRule } from "./types";

const CATEGORIES: GovCategory[] = ["legal", "brand", "compliance"];

// Presets de style de voix (appliqués aux deux langues, persistés).
const VOICE_PRESETS: { id: string; label: string; fr: string; en: string }[] = [
  {
    id: "corpo",
    label: "Corpo",
    fr: "Voix corporate : institutionnelle, formelle, vouvoiement, phrases complètes. Accent sur la fiabilité, la conformité et la pérennité. Pas d'argot ni de contractions. Pas d'emoji.",
    en: "Corporate voice: institutional, formal, complete sentences. Emphasis on reliability, compliance and longevity. No slang, no contractions. No emoji.",
  },
  {
    id: "technique",
    label: "Technique",
    fr: "Voix technique : précise et factuelle, orientée IT/MSP. Vocabulaire métier juste (PSA, RMM, SLA, MRR). Bénéfices mesurables, zéro superlatif, pas d'emoji.",
    en: "Technical voice: precise and factual, IT/MSP-oriented. Correct domain vocabulary (PSA, RMM, SLA, MRR). Measurable benefits, no superlatives, no emoji.",
  },
  {
    id: "marketing",
    label: "Marketing",
    fr: "Voix marketing : chaleureuse et directe, accroche + bénéfice. Contractions OK, rythme punché, CTA verbe + nom. Bénéfice d'abord, pas de mots creux. Pas d'emoji.",
    en: "Marketing voice: warm and direct, hook + benefit. Contractions OK, punchy rhythm, verb + noun CTAs. Benefit-first, no filler. No emoji.",
  },
  {
    id: "sales",
    label: "Sales",
    fr: "Voix sales : persuasive, orientée conversion. Crée l'élan sans surpromettre, double CTA (fort + doux), preuve sociale et proof points validés. Pas d'emoji.",
    en: "Sales voice: persuasive, conversion-oriented. Build momentum without over-promising, two-level CTA, social proof and approved proof points. No emoji.",
  },
  {
    id: "expect_better",
    label: "Expect Better",
    fr: "Principe 2026 « Expect Better » : l'artefact EST la marque. Surprendre par la qualité, refuser le générique — viser le « je n'ai jamais vu ça d'un fournisseur cloud ». Confiant, précis, humain. Pas d'emoji.",
    en: "2026 principle “Expect Better”: the artifact IS the brand. Surprise with quality, refuse the generic — aim for “I've never seen this from a cloud provider”. Confident, precise, human. No emoji.",
  },
];

export default function Governance({
  initialRules,
  initialVoice,
  initialModules,
}: {
  initialRules: GovRule[];
  initialVoice: { fr: string; en: string };
  initialModules: ModuleMeta[];
}) {
  const [rules, setRules] = useState<GovRule[]>(initialRules);
  const [voice, setVoice] = useState(initialVoice);
  const [modules, setModules] = useState<ModuleMeta[]>(initialModules);
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState<GovCategory>("brand");
  const [newRule, setNewRule] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ---- governance rules ----
  async function patchRule(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/governance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erreur ${res.status}`);
  }
  async function toggleRule(r: GovRule) {
    setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
    try {
      await patchRule(r.id, { enabled: !r.enabled });
    } catch (e) {
      setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, enabled: r.enabled } : x)));
      setErr(e instanceof Error ? e.message : "Échec.");
    }
  }
  async function saveRuleText(r: GovRule, text: string) {
    if (text.trim() === r.rule || text.trim().length < 5) return;
    setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, rule: text.trim() } : x)));
    try {
      await patchRule(r.id, { rule: text.trim() });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Échec.");
    }
  }
  async function removeRule(r: GovRule) {
    const prev = rules;
    setRules((rs) => rs.filter((x) => x.id !== r.id));
    const res = await fetch(`/api/governance/${r.id}`, { method: "DELETE" });
    if (!res.ok) {
      setRules(prev);
      setErr("Suppression échouée.");
    }
  }
  async function addRule() {
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

  // ---- tone of voice ----
  async function commitVoice(lang: "fr" | "en", text: string) {
    try {
      const res = await fetch("/api/tone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, text }),
      });
      if (!res.ok) throw new Error(String(res.status));
    } catch (e) {
      setErr(e instanceof Error ? `Tone : ${e.message}` : "Échec tone.");
    }
  }
  function onVoiceBlur(lang: "fr" | "en", text: string) {
    if (text.trim() === voice[lang] || text.trim().length < 5) return;
    setVoice((v) => ({ ...v, [lang]: text.trim() }));
    commitVoice(lang, text.trim());
  }
  function applyPreset(p: { fr: string; en: string }) {
    setVoice({ fr: p.fr, en: p.en });
    commitVoice("fr", p.fr);
    commitVoice("en", p.en);
  }

  // ---- context modules ----
  async function patchModule(id: string, body: Record<string, unknown>) {
    const res = await fetch("/api/modules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    if (!res.ok) throw new Error(String(res.status));
  }
  function saveModule(m: ModuleMeta, patch: Partial<ModuleMeta>) {
    setModules((ms) => ms.map((x) => (x.id === m.id ? { ...x, ...patch } : x)));
    patchModule(m.id, patch).catch(() => setErr("Échec module."));
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
          <h3 className="card-h" style={{ marginBottom: 12 }}>
            <i className="fa-solid fa-comment-dots" style={{ color: "var(--sw-blue-700)", marginRight: 8 }}></i>
            Tone of voice
          </h3>
          <div className="chips" style={{ marginBottom: 14 }}>
            {VOICE_PRESETS.map((p) => (
              <button key={p.id} className="chip" onClick={() => applyPreset(p)} title="Appliquer ce style">
                {p.label}
              </button>
            ))}
          </div>
          {(["fr", "en"] as const).map((l) => (
            <div key={l} className="tov-block">
              <span className="tov-lang">{l.toUpperCase()}</span>
              <textarea
                value={voice[l]}
                onChange={(e) => setVoice((v) => ({ ...v, [l]: e.target.value }))}
                onBlur={(e) => onVoiceBlur(l, e.target.value)}
                rows={4}
                style={voiceStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
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
                <button className="btn btn-brand" disabled={busy} onClick={addRule}>
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
                <textarea defaultValue={r.rule} onBlur={(e) => saveRuleText(r, e.target.value)} rows={2} style={editStyle} onFocus={focusBorder} />
                <button onClick={() => toggleRule(r)} title={r.enabled ? "Désactiver" : "Activer"} style={iconBtn(r.enabled ? "#1F8A5B" : "var(--sw-slate-300)", 18)}>
                  <i className={"fa-solid " + (r.enabled ? "fa-toggle-on" : "fa-toggle-off")}></i>
                </button>
                <button onClick={() => removeRule(r)} title="Supprimer" style={iconBtn("var(--sw-slate-400)", 13)}>
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h3 className="section-h">Modules de contexte · {modules.length} — éditables</h3>
      <div className="mod-grid">
        {modules.map((m) => (
          <div key={m.id} className="mod-card">
            <div className="mod-ico">
              <i className={"fa-solid " + m.icon}></i>
            </div>
            <input
              defaultValue={m.label}
              onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== m.label && saveModule(m, { label: e.target.value.trim() })}
              className="mod-name"
              style={modInput(15)}
            />
            <input
              defaultValue={m.sub}
              onBlur={(e) => e.target.value.trim() !== m.sub && saveModule(m, { sub: e.target.value.trim() })}
              className="mod-sub"
              style={modInput(12)}
            />
            <button
              onClick={() => saveModule(m, { live: !m.live })}
              className={"mod-state" + (m.live ? " live" : "")}
              style={{ border: 0, cursor: "pointer" }}
              title="Basculer Actif (live) / Configuré"
            >
              {m.live ? "Actif (live)" : "Configuré"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const voiceStyle: React.CSSProperties = {
  flex: 1, border: "1px solid transparent", borderRadius: 8, padding: "6px 8px", font: "inherit",
  fontSize: 13, lineHeight: 1.55, color: "var(--sw-ink-500)", resize: "vertical", background: "transparent",
};
const editStyle: React.CSSProperties = {
  flex: 1, border: "1px solid transparent", borderRadius: 8, padding: "4px 8px", font: "inherit",
  fontSize: 13, lineHeight: 1.5, color: "var(--sw-ink-700)", resize: "vertical", background: "transparent",
};
const modInput = (fs: number): React.CSSProperties => ({
  display: "block", width: "100%", border: "1px solid transparent", borderRadius: 6, padding: "2px 4px",
  font: "inherit", fontSize: fs, fontWeight: fs > 13 ? 700 : 400, color: fs > 13 ? "var(--sw-ink-900)" : "var(--sw-slate-500)",
  background: "transparent", marginBottom: fs > 13 ? 3 : 12,
});
const iconBtn = (color: string, fs: number): React.CSSProperties => ({
  border: 0, background: "transparent", cursor: "pointer", fontSize: fs, color,
});
function focusBorder(e: React.FocusEvent<HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "var(--color-border)";
}
