"use client";

import { useState } from "react";
import { OUTPUT_TYPES, ENGINES, outputMeta, engineMeta } from "@/lib/layerData";
import { STATUS_BADGE } from "@/lib/workflow";
import type { WSGen } from "./types";

export default function TeamActivity({
  items,
  onOpen,
}: {
  items: WSGen[];
  onOpen: (gen: WSGen) => void;
}) {
  const [fType, setFType] = useState("all");
  const [fLang, setFLang] = useState("all");
  const [fEngine, setFEngine] = useState("all");

  const filtered = items.filter(
    (g) =>
      (fType === "all" || g.type === fType) &&
      (fLang === "all" || g.lang === fLang) &&
      (fEngine === "all" || g.engine === fEngine),
  );

  return (
    <div>
      <div className="view-head">
        <p className="view-eyebrow">Activité de l&apos;équipe</p>
        <h1 className="view-title">La connaissance s&apos;accumule.</h1>
        <p className="view-sub">
          Chaque génération de l&apos;équipe passe par la même couche et nourrit l&apos;historique partagé.
        </p>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-n">{items.length}</div>
          <div className="stat-l">Générations</div>
        </div>
        <div className="stat-card">
          <div className="stat-n">100%</div>
          <div className="stat-l">On-brand</div>
        </div>
        <div className="stat-card">
          <div className="stat-n">{new Set(items.map((g) => g.user)).size}</div>
          <div className="stat-l">Contributeurs</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-quote">« Si quelqu&apos;un part, vous ne perdez pas la conscience de marque. »</div>
          <div className="stat-l">La couche retient tout.</div>
        </div>
      </div>

      <div className="filters">
        <div className="filt-group">
          <span className="filt-lbl">Type</span>
          <select className="filt-select" value={fType} onChange={(e) => setFType(e.target.value)}>
            <option value="all">Tous</option>
            {OUTPUT_TYPES.filter((t) => t.state === "active").map((t) => (
              <option key={t.id} value={t.id}>
                {t.fr}
              </option>
            ))}
          </select>
        </div>
        <div className="filt-group">
          <span className="filt-lbl">Langue</span>
          <select className="filt-select" value={fLang} onChange={(e) => setFLang(e.target.value)}>
            <option value="all">Toutes</option>
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </div>
        <div className="filt-group">
          <span className="filt-lbl">Moteur</span>
          <select className="filt-select" value={fEngine} onChange={(e) => setFEngine(e.target.value)}>
            <option value="all">Tous</option>
            {ENGINES.filter((e) => e.state !== "configured").map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="feed">
        {filtered.map((g) => {
          const om = outputMeta(g.type);
          const em = engineMeta(g.engine);
          return (
            <button key={g.id} className="feed-row" onClick={() => onOpen(g)}>
              <div className="fr-ico">
                <i className={"fa-solid " + (om?.icon ?? "fa-file-lines")}></i>
              </div>
              <div className="fr-main">
                <div className="fr-title">{g.title}</div>
                <div className="fr-tags">
                  <span className="fr-tag">{om?.fr ?? g.type}</span>
                  <span className="fr-tag">{g.lang.toUpperCase()}</span>
                  <span className="fr-tag eng">
                    <span className="fr-eng-dot" style={{ background: em?.brand ?? "#888" }}></span>
                    {em?.label ?? g.engine}
                  </span>
                  <span className="fr-model">{g.model}</span>
                  <span className="fr-status">{STATUS_BADGE[g.status].label}</span>
                </div>
              </div>
              <div className="fr-right">
                <span className="fr-onbrand">
                  <i className="fa-solid fa-circle-check"></i> On-brand
                </span>
                <div className="fr-who">
                  {g.who} · {g.ago}
                </div>
              </div>
              <i className="fa-solid fa-arrow-right fr-go"></i>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty">
            <i className="fa-solid fa-inbox"></i>
            <p>Aucune génération ne correspond à ces filtres.</p>
          </div>
        )}
      </div>
    </div>
  );
}
