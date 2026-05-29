"use client";

import { useState } from "react";
import { outputMeta, type ModuleMeta } from "@/lib/layerData";
import type { Role } from "@/lib/workflow";
import type { GovRule, WSGen } from "./types";
import Studio from "./Studio";
import TeamActivity from "./TeamActivity";
import Governance from "./Governance";
import CanvasView from "./CanvasView";
import Roles, { type TeamMember } from "./Roles";

type View = "studio" | "governance" | "activity" | "canvas" | "roles";

function initials(email: string): string {
  const name = email.split("@")[0] || "";
  const parts = name.split(/[.\-_]/).filter(Boolean);
  const s = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return s.toUpperCase();
}

export default function Workspace({
  initialGens,
  userEmail,
  governance,
  voice,
  modules,
  myRoles,
  users,
  currentUserId,
}: {
  initialGens: WSGen[];
  userEmail: string;
  governance: GovRule[];
  voice: { fr: string; en: string };
  modules: ModuleMeta[];
  myRoles: Role[];
  users: TeamMember[];
  currentUserId: string;
}) {
  const [view, setView] = useState<View>("studio");
  const [gens, setGens] = useState<WSGen[]>(initialGens);
  const [current, setCurrent] = useState<WSGen | null>(null);

  function openCanvas(item: WSGen) {
    setCurrent(item);
    setView("canvas");
  }
  function onComplete(gen: WSGen) {
    setGens((prev) => [gen, ...prev]);
    setCurrent(gen);
    setView("canvas");
  }

  const NAV: { id: View; label: string; icon: string; count?: number }[] = [
    { id: "studio", label: "Studio", icon: "fa-wand-magic" },
    { id: "governance", label: "La couche", icon: "fa-layer-group" },
    { id: "activity", label: "Activité de l'équipe", icon: "fa-users", count: gens.length },
    { id: "roles", label: "Rôles & workflow", icon: "fa-user-shield" },
  ];

  const tbTitle =
    view === "studio"
      ? "Studio"
      : view === "activity"
        ? "Activité de l'équipe"
        : view === "governance"
          ? "La couche"
          : view === "roles"
            ? "Rôles & workflow"
            : current?.title ?? "Canvas";

  return (
    <div className="sw-app-root">
      <div className="app">
        <div className="brandbar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/brand/Logo_Sherweb.svg" alt="Sherweb" />
          <span className="layer-badge">
            Layer<b>.</b>
          </span>
        </div>

        <div className="topbar">
          <span className="tb-title">{tbTitle}</span>
          <span className="tb-spacer"></span>
          <span className="tb-live">
            <span className="d"></span>Claude · ZDR · Canada
          </span>
          <span className="tb-pill">
            <span className="av">{initials(userEmail)}</span>
            {userEmail}
          </span>
        </div>

        <nav className="rail">
          <div className="seg">Espace de travail</div>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={"nav-item" + (view === n.id ? " on" : "")}
              onClick={() => setView(n.id)}
            >
              <i className={"fa-solid " + n.icon}></i>
              {n.label}
              {n.count != null && <span className="count">{n.count}</span>}
            </button>
          ))}
          <div className="seg">Récent</div>
          {gens.slice(0, 4).map((g) => (
            <button key={g.id} className="nav-item nav-recent" onClick={() => openCanvas(g)} title={g.title}>
              <i className={"fa-solid " + (outputMeta(g.type)?.icon ?? "fa-file-lines")}></i>
              <span className="nav-recent-t">{g.title}</span>
            </button>
          ))}
          <div className="rail-foot">
            <div className="iso">
              <i className="fa-solid fa-shield-halved"></i>Loi 25 · ZDR
            </div>
            <div style={{ marginTop: 6 }}>Données hébergées au Canada. Aucune rétention par les modèles.</div>
          </div>
        </nav>

        <main className="main">
          {view === "canvas" && current ? (
            <CanvasView gen={current} onClose={() => setView("activity")} modules={modules} myRoles={myRoles} />
          ) : (
            <div className="main-pad">
              {view === "studio" && (
                <Studio
                  onComplete={onComplete}
                  onGoActivity={() => setView("activity")}
                  recent={gens}
                  userEmail={userEmail}
                  modules={modules}
                />
              )}
              {view === "activity" && <TeamActivity items={gens} onOpen={openCanvas} />}
              {view === "governance" && <Governance initialRules={governance} initialVoice={voice} initialModules={modules} />}
              {view === "roles" && <Roles initialUsers={users} currentUserId={currentUserId} />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
