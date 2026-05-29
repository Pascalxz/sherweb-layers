"use client";

import { useState } from "react";
import { ROLES, type Role } from "@/lib/workflow";

export interface TeamMember {
  id: string;
  email: string;
  roles: Role[];
}

export default function Roles({ initialUsers, currentUserId }: { initialUsers: TeamMember[]; currentUserId: string }) {
  const [users, setUsers] = useState<TeamMember[]>(initialUsers);
  const [err, setErr] = useState<string | null>(null);

  async function toggle(u: TeamMember, role: Role) {
    const has = u.roles.includes(role);
    const op = has ? "remove" : "add";
    setUsers((us) =>
      us.map((x) =>
        x.id === u.id ? { ...x, roles: has ? x.roles.filter((r) => r !== role) : [...x.roles, role] } : x,
      ),
    );
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id, role, op }),
    });
    if (!res.ok) {
      setErr("Échec de mise à jour des rôles.");
      // revert
      setUsers((us) =>
        us.map((x) =>
          x.id === u.id ? { ...x, roles: has ? [...x.roles, role] : x.roles.filter((r) => r !== role) } : x,
        ),
      );
    }
  }

  function initials(email: string) {
    const n = email.split("@")[0].split(/[.\-_]/);
    return (n.length >= 2 ? n[0][0] + n[1][0] : email.slice(0, 2)).toUpperCase();
  }

  return (
    <div>
      <div className="view-head">
        <p className="view-eyebrow">Rôles &amp; responsabilités</p>
        <h1 className="view-title">Qui valide quoi.</h1>
        <p className="view-sub">
          Chaque génération suit un workflow : rédaction → design → code → QA → validation du demandeur →
          dev/prod. Les permissions sont <b>appliquées</b> : un rôle ne peut valider que son étape.
        </p>
        {err && <p style={{ color: "var(--sw-red-600)", fontSize: 13, marginTop: 8 }}>{err}</p>}
      </div>

      <div style={{ marginBottom: 18, fontSize: 12, color: "var(--sw-slate-500)" }}>
        Légende :{" "}
        {ROLES.map((r) => (
          <span key={r.id} className="role-badge" style={{ marginRight: 6 }}>
            <i className={"fa-solid " + r.icon} style={{ color: r.color }}></i>
            {r.label}
          </span>
        ))}
      </div>

      {users.map((u) => (
        <div key={u.id} className="team-row">
          <div className="team-av">{initials(u.email)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="team-mail">
              {u.email}
              {u.id === currentUserId && (
                <span style={{ fontSize: 11, color: "var(--sw-blue-700)", marginLeft: 8 }}>(vous)</span>
              )}
            </div>
            <div className="role-badges" style={{ marginTop: 8 }}>
              {ROLES.map((r) => {
                const on = u.roles.includes(r.id);
                return (
                  <button
                    key={r.id}
                    className={"role-badge role-toggle" + (on ? " on" : "")}
                    onClick={() => toggle(u, r.id)}
                    title={on ? "Retirer ce rôle" : "Assigner ce rôle"}
                  >
                    <i className={"fa-solid " + (on ? r.icon : "fa-plus")} style={{ color: on ? undefined : "var(--sw-slate-400)" }}></i>
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
      {users.length === 0 && (
        <div className="empty">
          <i className="fa-solid fa-users"></i>
          <p>Aucun membre. Invitez l&apos;équipe (magic link) puis assignez les rôles ici.</p>
        </div>
      )}
    </div>
  );
}
