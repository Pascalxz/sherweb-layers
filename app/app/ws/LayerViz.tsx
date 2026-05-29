"use client";

import { useMemo } from "react";
import { MODULES, ENGINES } from "@/lib/layerData";

type Phase = "idle" | "running" | "done";

export default function LayerViz({
  phase = "idle",
  activeIdx = -1,
  injected = new Set<string>(),
  engine = "claude",
  compact = false,
  showLabels = true,
}: {
  phase?: Phase;
  activeIdx?: number;
  injected?: Set<string>;
  engine?: string;
  compact?: boolean;
  showLabels?: boolean;
}) {
  const mods = MODULES;
  const n = mods.length;
  const positions = useMemo(
    () =>
      mods.map((_, i) => {
        const ang = ((-67.5 + i * (360 / n)) * Math.PI) / 180;
        return { x: 50 + Math.cos(ang) * 35, y: 50 + Math.sin(ang) * 40 };
      }),
    [mods, n],
  );

  const eng = ENGINES.find((e) => e.id === engine) ?? ENGINES[0];
  const coreLit = phase === "running" || phase === "done";

  return (
    <div className={"lv " + (compact ? "lv-compact " : "") + "lv-" + phase}>
      <svg className="lv-wires" viewBox="0 0 100 100" preserveAspectRatio="none">
        {positions.map((p, i) => {
          const lit = injected.has(mods[i].id);
          const firing = i === activeIdx;
          return (
            <line
              key={i}
              x1={p.x}
              y1={p.y}
              x2="50"
              y2="50"
              className={"lv-wire" + (lit ? " lit" : "") + (firing ? " firing" : "")}
            />
          );
        })}
      </svg>

      {positions.map((p, i) => {
        const m = mods[i];
        const lit = injected.has(m.id);
        const firing = i === activeIdx;
        return (
          <div
            key={m.id}
            className={
              "lv-node" +
              (lit ? " lit" : "") +
              (firing ? " firing" : "") +
              (m.live ? " live" : "")
            }
            style={{ left: p.x + "%", top: p.y + "%" }}
          >
            <div className="lv-node-ico">
              <i className={"fa-solid " + m.icon}></i>
            </div>
            {!compact && showLabels && <div className="lv-node-lbl">{m.label}</div>}
          </div>
        );
      })}

      <div className={"lv-core" + (coreLit ? " on" : "")}>
        <div className="lv-core-ring r3"></div>
        <div className="lv-core-ring r2"></div>
        <div className="lv-core-ring r1"></div>
        <div className="lv-core-dot">
          <span className="lv-core-pulse"></span>
          <i className="fa-solid fa-layer-group"></i>
        </div>
        {!compact && (
          <div className="lv-core-label">
            <div className="lv-core-title">La couche Sherweb</div>
            <div className="lv-core-status">
              <span className="lv-dot-live"></span>
              {phase === "running" ? "Injection en cours…" : "Toujours active"}
            </div>
          </div>
        )}
      </div>

      {!compact && (
        <div className={"lv-port lv-port-in" + (phase !== "idle" ? " active" : "")}>
          <div className="lv-port-chip">
            <span className="lv-eng-glyph" style={{ background: eng.brand }}>
              {eng.glyph}
            </span>
            {eng.label}
          </div>
          <div className="lv-port-cap">Moteur IA</div>
        </div>
      )}
      {!compact && (
        <div className={"lv-port lv-port-out" + (phase === "done" ? " active" : "")}>
          <div className="lv-port-chip out">
            <i className="fa-solid fa-circle-check"></i> On-brand
          </div>
          <div className="lv-port-cap">Output</div>
        </div>
      )}
    </div>
  );
}
