"use client";

import { useState } from "react";
import Link from "next/link";
import { renderDocument } from "@/lib/components/htmlLibrary";
import { MODULES, GOVERNANCE, outputMeta } from "@/lib/layerData";
import type { WSGen } from "./types";

export default function CanvasView({
  gen,
  onClose,
  transparencyOpen = true,
}: {
  gen: WSGen;
  onClose: () => void;
  transparencyOpen?: boolean;
}) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [sideOpen, setSideOpen] = useState(transparencyOpen);

  return (
    <div className="canvas-wrap">
      <div className="cv-toolbar">
        <button className="cv-back" onClick={onClose} title="Retour">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="cv-titlewrap">
          <div className="cv-title">{gen.title}</div>
          <div className="cv-meta">
            <span className={"cv-badge " + (gen.source === "live" ? "live" : "demo")}>
              <i className="fa-solid fa-bolt"></i>
              {gen.source === "live" ? "Généré en direct" : "Démo"}
            </span>
            <span className="cv-tag">{outputMeta(gen.type)?.fr ?? gen.type}</span>
            <span className="cv-tag">{gen.lang.toUpperCase()}</span>
            <span className="cv-tag onbrand">
              <i className="fa-solid fa-circle-check"></i> On-brand
            </span>
            <span className="cv-tag">{gen.model}</span>
          </div>
        </div>

        <div className="cv-tabs">
          <button className={"cv-tab" + (tab === "preview" ? " on" : "")} onClick={() => setTab("preview")}>
            <i className="fa-solid fa-eye"></i>Aperçu
          </button>
          <button className={"cv-tab" + (tab === "code" ? " on" : "")} onClick={() => setTab("code")}>
            <i className="fa-solid fa-code"></i>Code
          </button>
        </div>

        <div className="cv-actions" style={{ marginLeft: 12 }}>
          <Link href={`/app/canvas/${gen.id}`} className="btn btn-brand">
            <i className="fa-solid fa-pen-ruler"></i>Édition visuelle
          </Link>
        </div>
      </div>

      <div className="cv-body">
        <div className="cv-stage">
          <div className="cv-frame-pad">
            {tab === "preview" ? (
              <iframe className="cv-frame" title="preview" srcDoc={renderDocument(gen.html)} />
            ) : (
              <textarea className="cv-code" readOnly value={gen.html} />
            )}
          </div>
        </div>

        <div className={"cv-side" + (sideOpen ? "" : " collapsed")}>
          <button className="cv-side-toggle" onClick={() => setSideOpen((v) => !v)} title="Panneau de transparence">
            <i className={"fa-solid " + (sideOpen ? "fa-chevron-right" : "fa-chevron-left")}></i>
          </button>
          {sideOpen && (
            <div className="cv-side-inner">
              <div className="cv-side-h">
                <i className="fa-solid fa-layer-group"></i>Ce que la couche a injecté
              </div>
              <p className="cv-side-lead">
                Tout ceci a été ajouté automatiquement au prompt — c&apos;est ce qui rend l&apos;output on-brand,
                peu importe le moteur.
              </p>

              <div className="cv-side-sec">
                <div className="cv-side-label">Modules de contexte · {MODULES.length}</div>
                <div className="cv-mods">
                  {MODULES.map((m) => (
                    <span key={m.id} className={"cv-mod" + (m.live ? " live" : "")}>
                      <i className={"fa-solid " + m.icon}></i>
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="cv-side-sec">
                <div className="cv-side-label">Connaissance injectée (RAG) · {gen.ragChunkTitles.length}</div>
                {gen.ragChunkTitles.length === 0 && (
                  <span style={{ fontSize: 12, color: "var(--sw-slate-400)" }}>
                    Aucun chunk pertinent — marque + gouvernance suffisent.
                  </span>
                )}
                {gen.ragChunkTitles.map((t, i) => (
                  <div key={i} className="cv-chunk">
                    <b>{t}</b>
                  </div>
                ))}
              </div>

              <div className="cv-side-sec" style={{ borderBottom: 0 }}>
                <div className="cv-side-label">Règles de gouvernance · {GOVERNANCE.length}</div>
                {GOVERNANCE.map((g) => (
                  <div key={g.id} className="cv-rule">
                    <span className={"cv-cat " + g.cat}>{g.cat}</span>
                    <span>{g.rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
