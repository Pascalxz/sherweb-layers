"use client";

import { MODULES, GOVERNANCE, TONE } from "@/lib/layerData";

export default function Governance() {
  return (
    <div>
      <div className="view-head">
        <p className="view-eyebrow">Cœur du produit</p>
        <h1 className="view-title">La couche : gouvernance &amp; tone of voice</h1>
        <p className="view-sub">
          Le contexte non négociable, injecté intégralement dans chaque génération. Modifiez-le ici,
          et toute l&apos;équipe sort on-brand dès le prochain prompt.
        </p>
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
          <h3 className="card-h" style={{ marginBottom: 14 }}>
            <i className="fa-solid fa-scale-balanced" style={{ color: "var(--sw-red-600)", marginRight: 8 }}></i>
            Règles de gouvernance · {GOVERNANCE.length}
          </h3>
          <div className="gov-rules">
            {GOVERNANCE.map((g) => (
              <div key={g.id} className="gov-rule">
                <span className={"cv-cat " + g.cat}>{g.cat}</span>
                <span>{g.rule}</span>
                <span className="gov-on">
                  <i className="fa-solid fa-toggle-on"></i>
                </span>
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
