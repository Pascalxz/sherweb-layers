"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { renderDocument } from "@/lib/components/htmlLibrary";
import { MODULES, GOVERNANCE, outputMeta, type ModuleMeta } from "@/lib/layerData";
import { STATUS_BADGE, type Role } from "@/lib/workflow";
import type { WSGen } from "./types";
import WorkflowBar from "./WorkflowBar";
import WriterComments from "./WriterComments";

// GrapesJS casse en SSR → import client-only (piège connu CLAUDE.md).
const InlineEditor = dynamic(() => import("./InlineEditor"), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sw-slate-400)" }}>
      Chargement de l&apos;éditeur…
    </div>
  ),
});

type Tab = "comments" | "preview" | "edit" | "code";

export default function CanvasView({
  gen,
  onClose,
  transparencyOpen = true,
  modules = MODULES,
  myRoles = [],
  currentUserId = "",
}: {
  gen: WSGen;
  onClose: () => void;
  transparencyOpen?: boolean;
  modules?: ModuleMeta[];
  myRoles?: Role[];
  currentUserId?: string;
}) {
  const canEdit =
    gen.isOwner || myRoles.includes("designer") || myRoles.includes("coder") || myRoles.includes("admin");
  const [tab, setTab] = useState<Tab>("preview");
  const [sideOpen, setSideOpen] = useState(transparencyOpen);
  const [html, setHtml] = useState(gen.html);

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
            <span className="cv-tag status">{STATUS_BADGE[gen.status].label}</span>
            <span className="cv-tag">{gen.model}</span>
          </div>
        </div>

        <div className="cv-tabs">
          <button className={"cv-tab" + (tab === "comments" ? " on" : "")} onClick={() => setTab("comments")}>
            <i className="fa-solid fa-comments"></i>Texte
          </button>
          <button className={"cv-tab" + (tab === "preview" ? " on" : "")} onClick={() => setTab("preview")}>
            <i className="fa-solid fa-eye"></i>Aperçu
          </button>
          {canEdit && (
            <button className={"cv-tab" + (tab === "edit" ? " on" : "")} onClick={() => setTab("edit")}>
              <i className="fa-solid fa-pen-ruler"></i>Édition visuelle
            </button>
          )}
          <button className={"cv-tab" + (tab === "code" ? " on" : "")} onClick={() => setTab("code")}>
            <i className="fa-solid fa-code"></i>Code
          </button>
        </div>
      </div>

      <WorkflowBar generationId={gen.id} initialStatus={gen.status} myRoles={myRoles} isOwner={gen.isOwner} />

      <div className="cv-body">
        <div className="cv-stage">
          {tab === "comments" && (
            <WriterComments generationId={gen.id} html={html} currentUserId={currentUserId} />
          )}
          {tab === "preview" && (
            <div className="cv-frame-pad">
              <iframe className="cv-frame" title="preview" srcDoc={renderDocument(html)} />
            </div>
          )}
          {tab === "edit" && (
            <InlineEditor generationId={gen.id} initialHtml={html} onSaved={(h) => setHtml(h)} />
          )}
          {tab === "code" && <textarea className="cv-code" readOnly value={html} />}
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
                <div className="cv-side-label">Modules de contexte · {modules.length}</div>
                <div className="cv-mods">
                  {modules.map((m) => (
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

              <div className="cv-side-sec">
                <div className="cv-side-label">Règles de gouvernance · {GOVERNANCE.length}</div>
                {GOVERNANCE.map((g) => (
                  <div key={g.id} className="cv-rule">
                    <span className={"cv-cat " + g.cat}>{g.cat}</span>
                    <span>{g.rule}</span>
                  </div>
                ))}
              </div>

              {gen.systemPrompt && (
                <div className="cv-side-sec" style={{ borderBottom: 0 }}>
                  <div className="cv-side-label">System prompt envoyé au moteur</div>
                  <details className="cv-prompt">
                    <summary>
                      <i className="fa-solid fa-terminal"></i> Voir le prompt complet ({gen.systemPrompt.length.toLocaleString("fr")} car.)
                    </summary>
                    <pre>{gen.systemPrompt}</pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
