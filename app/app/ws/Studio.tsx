"use client";

import { useState } from "react";
import type { Engine, Lang, OutputType } from "@/lib/types";
import { ENGINES, OUTPUT_TYPES, MODULES, outputMeta, type ModuleMeta } from "@/lib/layerData";
import type { WSGen } from "./types";
import { makeTitle } from "./types";
import LayerViz from "./LayerViz";

const PROMPT_EXAMPLES: Record<string, string[]> = {
  landing_page: [
    "Un microsite pour inviter des MSP émergents à découvrir notre programme white-label",
    "Une landing page pour vendre Acronis Cyber Protect aux MSP",
    "Page produit Cloud PBX pour partenaires",
  ],
  email: [
    "Un email pour annoncer le changement du programme partenaire Microsoft",
    "Invitation à un webinaire sur la sécurité Microsoft 365",
  ],
  brief: [
    "Un brief one-pager pour pitcher Azure à un MSP émergent",
    "Brief : ajouter la cybersécurité Acronis à une offre MSP",
  ],
};

type Phase = "idle" | "running" | "done";

export default function Studio({
  onComplete,
  onGoActivity,
  recent,
  userEmail,
  speed = 440,
  showLabels = true,
  modules = MODULES,
}: {
  onComplete: (gen: WSGen) => void;
  onGoActivity: () => void;
  recent: WSGen[];
  userEmail: string;
  speed?: number;
  showLabels?: boolean;
  modules?: ModuleMeta[];
}) {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<OutputType>("landing_page");
  const [lang, setLang] = useState<Lang>("fr");
  const [engine, setEngine] = useState<Engine>("claude");

  const [phase, setPhase] = useState<Phase>("idle");
  const [activeIdx, setActiveIdx] = useState(-1);
  const [injected, setInjected] = useState<Set<string>>(new Set());
  const [ticker, setTicker] = useState<{ idx: number; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const running = phase === "running" || phase === "done";
  const examples = PROMPT_EXAMPLES[type] ?? [];

  async function generate() {
    if (!prompt.trim() || running) return;
    setPhase("running");
    setInjected(new Set());
    setActiveIdx(-1);
    setTicker(null);
    setError(null);

    const order = modules.map((m) => m.id);
    const genPromise = fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, outputType: type, lang, engine }),
    })
      .then(async (r) => ({ ok: r.ok, ...(await r.json()) }))
      .catch((e) => ({ ok: false, error: String(e) }));

    // Chorégraphie : injection des modules un par un pendant l'appel réel.
    await new Promise<void>((res) => {
      let i = 0;
      const tick = () => {
        if (i >= order.length) {
          setActiveIdx(-1);
          res();
          return;
        }
        setActiveIdx(i);
        setInjected((prev) => new Set(prev).add(order[i]));
        setTicker({ idx: i, pct: Math.round(((i + 1) / order.length) * 100) });
        i++;
        setTimeout(tick, speed);
      };
      tick();
    });

    const result = await genPromise;
    if (!result.ok) {
      setError(result.error ?? "Échec de la génération.");
      setPhase("idle");
      return;
    }
    setPhase("done");

    const gen: WSGen = {
      id: result.generationId,
      title: makeTitle(prompt, outputMeta(type)?.fr ?? "Output"),
      type,
      lang,
      engine,
      model: result.model,
      prompt,
      html: result.html,
      ragChunkTitles: result.ragChunkTitles ?? [],
      who: "Vous",
      user: userEmail,
      ago: "à l'instant",
      source: "live",
      systemPrompt: result.systemPrompt,
      status: "draft",
      isOwner: true,
    };
    setTimeout(() => onComplete(gen), 750);
  }

  const tickerMod = ticker ? modules[ticker.idx] : null;

  return (
    <div>
      <div className="view-head">
        <p className="view-eyebrow">Studio</p>
        <h1 className="view-title">Générez du contenu on-brand, en un prompt.</h1>
        <p className="view-sub">
          Connecté en tant que <b>{userEmail}</b>. Chaque génération passe par la couche Sherweb —
          design system, tone of voice, connaissance produit et gouvernance — peu importe le moteur.
        </p>
      </div>

      <div className="studio-grid">
        {/* compose */}
        <div className="card card-pad">
          <span className="field-lbl">Demande</span>
          <textarea
            className="prompt-box"
            placeholder="Ex. : un microsite pour inviter des MSP émergents à découvrir notre programme white-label…"
            value={prompt}
            disabled={running}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="chips" style={{ marginTop: 10 }}>
            {examples.map((ex, i) => (
              <button key={i} className="chip" disabled={running} onClick={() => setPrompt(ex)}>
                {ex.length > 46 ? ex.slice(0, 44) + "…" : ex}
              </button>
            ))}
          </div>

          <div className="field-row">
            <div className="field-col">
              <span className="field-lbl">Type</span>
              <div className="seg-ctl">
                {OUTPUT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    className={type === t.id ? "on" : ""}
                    disabled={running || t.state === "soon"}
                    onClick={() => setType(t.id as OutputType)}
                    title={t.state === "soon" ? "Bientôt" : ""}
                  >
                    {t.fr}
                  </button>
                ))}
              </div>
            </div>
            <div className="field-col">
              <span className="field-lbl">Langue de l&apos;output</span>
              <div className="seg-ctl">
                {(["fr", "en"] as Lang[]).map((l) => (
                  <button key={l} className={lang === l ? "on" : ""} disabled={running} onClick={() => setLang(l)}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <span className="field-lbl">Moteur IA</span>
            <div className="engines">
              {ENGINES.map((e) => (
                <button
                  key={e.id}
                  className={"engine" + (engine === e.id ? " on" : "")}
                  disabled={running || e.state === "configured"}
                  onClick={() => setEngine(e.id as Engine)}
                >
                  <span className="glyph" style={{ background: e.brand }}>
                    {e.glyph}
                  </span>
                  <span>
                    <span className="en-name">{e.label}</span>
                    <span className="en-sub">{e.sub}</span>
                  </span>
                  <span className={"en-state " + e.state}>
                    {e.state === "active" ? "Actif" : e.state === "selectable" ? "Disponible" : "Configuré"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button className="gen-btn" onClick={generate} disabled={!prompt.trim() || running}>
            {running ? (
              <>
                <span className="spin"></span>Génération on-brand…
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic"></i>Générer on-brand
              </>
            )}
          </button>
          {error && <p style={{ color: "var(--sw-red-600)", fontSize: 13, marginTop: 12 }}>{error}</p>}
        </div>

        {/* layer panel */}
        <div className="layer-panel">
          <div className="layer-panel-head">
            <div>
              <div className="lp-title">La couche Sherweb</div>
              <div className="lp-sub">8 modules de contexte · injection automatique</div>
            </div>
            <span className="lp-always">
              <span className="d"></span>TOUJOURS ACTIVE
            </span>
          </div>

          <LayerViz phase={phase} activeIdx={activeIdx} injected={injected} engine={engine} showLabels={showLabels} modules={modules} />

          <div className={"lp-ticker " + (phase === "idle" ? "idle" : tickerMod?.live ? "fire" : "")}>
            <div className="t-ico">
              <i className={"fa-solid " + (tickerMod ? tickerMod.icon : "fa-layer-group")}></i>
            </div>
            {phase === "idle" && (
              <div className="t-main">En attente d&apos;une demande — la couche injectera le contexte de marque ici.</div>
            )}
            {phase !== "idle" && tickerMod && (
              <div>
                <div className="t-main">Injection : {tickerMod.label}</div>
                <div className="t-sub">{tickerMod.sub}</div>
              </div>
            )}
            {phase === "done" && (
              <div className="t-main" style={{ color: "#9FE6C2" }}>
                <i className="fa-solid fa-circle-check"></i> Contexte injecté — output on-brand prêt.
              </div>
            )}
            {ticker && phase === "running" && <div className="t-prog">{ticker.pct}%</div>}
          </div>

          {phase !== "idle" && (
            <div className="lp-progress">
              <span className="lp-progress-bar" style={{ width: `${ticker?.pct ?? 0}%` }}></span>
            </div>
          )}
        </div>
      </div>

      {/* recent activity strip */}
      <div className="recent-strip">
        <div className="recent-head">
          <h3>Activité récente de l&apos;équipe</h3>
          <button className="link-btn" onClick={onGoActivity}>
            Tout voir <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
        <div className="recent-row">
          {recent.slice(0, 3).map((a) => (
            <div key={a.id} className="recent-card">
              <div className="rc-type">
                <i className={"fa-solid " + (outputMeta(a.type)?.icon ?? "fa-file-lines")}></i>
                {outputMeta(a.type)?.fr ?? a.type}
              </div>
              <div className="rc-title">{a.title}</div>
              <div className="rc-foot">
                <span className="rc-who">{a.who}</span>
                <span className="rc-ago">{a.ago}</span>
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="recent-card">
              <div className="rc-title">Aucune génération pour l&apos;instant — lancez-en une.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
