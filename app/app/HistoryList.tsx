"use client";

import { useState } from "react";
import { renderDocument } from "@/lib/components/htmlLibrary";

export interface HistoryEntry {
  id: string;
  output_type: string;
  lang: string;
  prompt: string;
  html: string;
  model: string;
  engine: string | null;
  authorEmail: string | null;
  createdAt: string;
}

export default function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <p className="text-sherweb-muted text-sm">
        Aucune génération pour l'instant — l'historique de l'équipe apparaîtra ici.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((e) => {
        const open = openId === e.id;
        return (
          <li key={e.id} className="border border-sherweb-border rounded-sherweb bg-white overflow-hidden">
            <button
              onClick={() => setOpenId(open ? null : e.id)}
              className="w-full text-left px-4 py-3 hover:bg-sherweb-bgAlt transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-sherweb-heading truncate">{e.prompt}</span>
                <span className="text-xs text-sherweb-muted whitespace-nowrap">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
                <Badge>{e.output_type}</Badge>
                <Badge>{e.lang.toUpperCase()}</Badge>
                {e.engine && <Badge>{e.engine}</Badge>}
                <span className="text-sherweb-muted">{e.model}</span>
                {e.authorEmail && <span className="text-sherweb-muted">· {e.authorEmail}</span>}
              </div>
            </button>
            {open && (
              <iframe
                title={`preview-${e.id}`}
                srcDoc={renderDocument(e.html)}
                className="w-full h-[500px] border-0 border-t border-sherweb-border"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-sherweb bg-sherweb-bgAlt text-sherweb-body uppercase tracking-button">
      {children}
    </span>
  );
}
