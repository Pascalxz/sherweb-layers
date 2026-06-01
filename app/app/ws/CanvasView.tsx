"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { renderDocument } from "@/lib/components/htmlLibrary";
import { MODULES, GOVERNANCE, outputMeta, type ModuleMeta } from "@/lib/layerData";
import { STATUS_BADGE, type Role } from "@/lib/workflow";
import type { WSGen } from "./types";
import WorkflowBar from "./WorkflowBar";
import WriterComments from "./WriterComments";
import ReviewPanel from "./ReviewPanel";
import ShareMenu from "./ShareMenu";
import RevisePanel from "./RevisePanel";

const InlineEditor = dynamic(() => import("./InlineEditor"), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sw-slate-400)" }}>
      Chargement de l&apos;éditeur…
    </div>
  ),
});

// Onglets orientés rôle (pipeline de production).
type Tab = "writer" | "design" | "code" | "qa" | "deliver";
const TABS: { id: Tab; label: string; icon: string; role: Role | null }[] = [
  { id: "writer", label: "Rédacteur", icon: "fa-pen-nib", role: "writer" },
  { id: "design", label: "Designer", icon: "fa-pen-ruler", role: "designer" },
  { id: "code", label: "Intégrateur", icon: "fa-code", role: "coder" },
  { id: "qa", label: "QA", icon: "fa-clipboard-check", role: "qa" },
  { id: "deliver", label: "Livraison", icon: "fa-rocket", role: "requester" },
];

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
  const [tab, setTab] = useState<Tab>("writer");
  // Sur Rédacteur/Designer, la colonne « corrections » + les commentaires occupent déjà
  // beaucoup : le panneau de transparence démarre replié (récupérable via sa flèche).
  const [sideOpen, setSideOpen] = useState(false);
  const [html, setHtml] = useState(gen.html);
  const [designMode, setDesignMode] = useState(false); // false = aperçu, true = GrapesJS

  const has = (r: Role) => myRoles.includes(r) || myRoles.includes("admin");
  const isOwner = gen.isOwner;
  const canWriter = isOwner || has("writer");
  const canDesign = isOwner || has("designer");
  const canCode = isOwner || has("coder");

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
            <span className="cv-tag status">{STATUS_BADGE[gen.status].label}</span>
            <span className="cv-tag">{gen.model}</span>
          </div>
        </div>

        <div className="cv-tabs cv-role-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={"cv-tab" + (tab === t.id ? " on" : "")} onClick={() => setTab(t.id)}>
              <i className={"fa-solid " + t.icon}></i>
              {t.label}
            </button>
          ))}
        </div>
        <ShareMenu generationId={gen.id} canManage={isOwner || has("admin")} />
      </div>

      <WorkflowBar generationId={gen.id} initialStatus={gen.status} myRoles={myRoles} isOwner={isOwner} />

      <div className="cv-body">
        {(tab === "writer" || tab === "design") && (
          <div className="cv-revise-col">
            <RevisePanel generationId={gen.id} canEdit={canWriter || canDesign} onRevised={(h) => setHtml(h)} />
          </div>
        )}
        <div className="cv-stage">
          {tab === "writer" && (
            <WriterComments
              generationId={gen.id}
              html={html}
              currentUserId={currentUserId}
              canEdit={canWriter}
              onSaved={(h) => setHtml(h)}
            />
          )}

          {tab === "design" &&
            (designMode && canDesign ? (
              <div style={{ display: "flex", flexDirection: "column", width: "100%", minWidth: 0 }}>
                <div className="wc-toolbar">
                  <span className="wc-tb-name">
                    <i className="fa-solid fa-pen-ruler" style={{ color: "var(--sw-blue-700)" }}></i> Édition design
                  </span>
                  <button className="btn btn-ghost" style={{ marginLeft: "auto", padding: "7px 13px", fontSize: 13 }} onClick={() => setDesignMode(false)}>
                    <i className="fa-solid fa-eye"></i> Revenir à l&apos;aperçu
                  </button>
                </div>
                <InlineEditor generationId={gen.id} initialHtml={html} onSaved={(h) => setHtml(h)} />
              </div>
            ) : (
              <ReviewPanel
                generationId={gen.id}
                html={html}
                currentUserId={currentUserId}
                kind="design"
                canEdit={canDesign}
                onEditDesign={() => setDesignMode(true)}
              />
            ))}

          {tab === "code" && (
            <ReviewPanel
              generationId={gen.id}
              html={html}
              currentUserId={currentUserId}
              kind="code"
              canEdit={canCode}
              onSavedCode={(h) => setHtml(h)}
            />
          )}

          {tab === "qa" && (
            <ReviewPanel generationId={gen.id} html={html} currentUserId={currentUserId} kind="qa" canEdit={true} />
          )}

          {tab === "deliver" && <DeliverPanel gen={gen} html={html} />}
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
                Tout ceci a été ajouté automatiquement au prompt — c&apos;est ce qui rend l&apos;output on-brand.
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
                  <span style={{ fontSize: 12, color: "var(--sw-slate-400)" }}>Aucun chunk pertinent.</span>
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
                      <i className="fa-solid fa-terminal"></i> Voir le prompt complet
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

function DeliverPanel({ gen, html }: { gen: WSGen; html: string }) {
  const published = gen.status === "published";
  function downloadHtml() {
    const blob = new Blob([renderDocument(html)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${gen.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="cv-frame-pad" style={{ display: "flex", justifyContent: "center" }}>
      <div className="deliver-card">
        <div className={"deliver-state " + (published ? "ok" : "wait")}>
          <i className={"fa-solid " + (published ? "fa-circle-check" : "fa-hourglass-half")}></i>
          {published ? "Publié en production" : "En attente de validation"}
        </div>
        <h2>Livraison</h2>
        <p>
          {published
            ? "Ce contenu a passé tout le pipeline (rédaction → design → code → QA → validation) et est marqué publié."
            : "Une fois la validation du demandeur obtenue, l'étape « Envoyer en prod » de la barre de workflow ci-dessus marque la livraison."}
        </p>
        <div className="deliver-steps">
          {["Rédaction", "Design", "Code", "QA", "Validation", "Prod"].map((s, i) => (
            <span key={s} className="deliver-step">
              <i className="fa-solid fa-check"></i>
              {s}
              {i < 5 && <span className="deliver-arrow">→</span>}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <button className="btn btn-brand" onClick={downloadHtml}>
            <i className="fa-solid fa-download"></i> Exporter le HTML
          </button>
          <Link href={`/app/canvas/${gen.id}`} className="btn btn-ghost">
            <i className="fa-solid fa-up-right-from-square"></i> Ouvrir en plein écran
          </Link>
        </div>
      </div>
    </div>
  );
}
