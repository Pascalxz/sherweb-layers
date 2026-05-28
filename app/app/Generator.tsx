"use client";

import { useState } from "react";
import { renderDocument } from "@/lib/components/htmlLibrary";
import type { Engine, GenerateResponse, Lang, OutputType } from "@/lib/types";

const OUTPUTS: { value: OutputType; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "brief", label: "Brief" },
];
const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
];
const ENGINES: { value: Engine; label: string }[] = [
  { value: "claude", label: "Claude" },
  { value: "openai", label: "OpenAI" },
];

type Status = "idle" | "generating" | "done" | "error";

export default function Generator() {
  const [prompt, setPrompt] = useState("");
  const [outputType, setOutputType] = useState<OutputType>("email");
  const [lang, setLang] = useState<Lang>("en");
  const [engine, setEngine] = useState<Engine>("claude");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [view, setView] = useState<"preview" | "code">("preview");

  async function generate() {
    setStatus("generating");
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, outputType, lang, engine }),
      });
      const data = (await res.json()) as GenerateResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      setResult(data);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
      setStatus("error");
    }
  }

  const busy = status === "generating";

  return (
    <section className="space-y-6">
      <div className="border border-sherweb-border rounded-sherweb p-6 space-y-5 bg-white">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-sherweb-heading">Demande</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex. : un email pour inviter des MSP émergents à découvrir notre programme white-label…"
            rows={3}
            className="w-full border border-sherweb-border rounded-sherweb px-4 py-3 focus:outline-none focus:border-sherweb-primary resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <Toggle label="Type" options={OUTPUTS} value={outputType} onChange={setOutputType} />
          <Toggle label="Langue" options={LANGS} value={lang} onChange={setLang} />
          <Toggle label="Moteur" options={ENGINES} value={engine} onChange={setEngine} />
        </div>

        <button
          onClick={generate}
          disabled={busy || prompt.trim().length < 3}
          className="btn-primary disabled:opacity-50"
        >
          {busy ? "Génération…" : "Générer on-brand"}
        </button>

        {status === "error" && <p className="text-sherweb-accent text-sm">{error}</p>}
      </div>

      {result && (
        <div className="border border-sherweb-border rounded-sherweb overflow-hidden bg-white">
          <div className="flex items-center justify-between px-4 py-2 border-b border-sherweb-border bg-sherweb-bgAlt">
            <div className="flex gap-2">
              <ViewTab active={view === "preview"} onClick={() => setView("preview")}>
                Aperçu
              </ViewTab>
              <ViewTab active={view === "code"} onClick={() => setView("code")}>
                Code
              </ViewTab>
            </div>
            <span className="text-xs text-sherweb-muted">
              {result.model}
              {result.ragChunkTitles.length > 0 &&
                ` · RAG: ${result.ragChunkTitles.length} chunk(s)`}
            </span>
          </div>

          {view === "preview" ? (
            <iframe
              title="preview"
              srcDoc={renderDocument(result.html)}
              className="w-full h-[600px] border-0"
            />
          ) : (
            <pre className="p-4 text-xs overflow-auto h-[600px] bg-sherweb-heading text-white/90">
              <code>{result.html}</code>
            </pre>
          )}
        </div>
      )}
    </section>
  );
}

function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs uppercase tracking-button text-sherweb-muted">{label}</span>
      <div className="flex rounded-sherweb border border-sherweb-border overflow-hidden">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 text-sm transition-colors ${
              value === o.value
                ? "bg-sherweb-primary text-white"
                : "bg-white text-sherweb-body hover:bg-sherweb-bgAlt"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3 py-1 rounded-sherweb ${
        active ? "bg-white text-sherweb-heading font-semibold" : "text-sherweb-muted"
      }`}
    >
      {children}
    </button>
  );
}
