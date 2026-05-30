import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { renderDocument } from "@/lib/components/htmlLibrary";
import { outputMeta } from "@/lib/layerData";
import { STATUS_BADGE } from "@/lib/workflow";
import type { Status } from "@/lib/workflow";

export const dynamic = "force-dynamic";

// Page publique en lecture seule — accessible sans authentification via un token révocable.
export default async function SharePage({ params }: { params: { token: string } }) {
  const supabase = createSupabaseAdminClient();
  const { data: gen } = await supabase
    .from("generations")
    .select("output_type, lang, prompt, output_html, edited_html, model, status, share_token")
    .eq("share_token", params.token)
    .maybeSingle();

  if (!gen) notFound();

  const html = (gen.edited_html as string | null) ?? (gen.output_html as string);
  const om = outputMeta(gen.output_type as string);
  const status = (gen.status ?? "published") as Status;

  return (
    <main style={{ minHeight: "100vh", background: "var(--sw-slate-100)", fontFamily: "var(--ff-sans)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 24px",
          background: "var(--sw-white)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/Logo_Sherweb.svg" alt="Sherweb" style={{ height: 22 }} />
        <span
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: "var(--sw-blue-700)",
            borderLeft: "1px solid var(--color-border-strong)",
            paddingLeft: 10,
          }}
        >
          Layer<span style={{ color: "var(--sw-red-600)" }}>.</span>
        </span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span className="cv-tag">{om?.fr ?? gen.output_type}</span>
          <span className="cv-tag">{String(gen.lang).toUpperCase()}</span>
          <span className="cv-tag onbrand">
            <i className="fa-solid fa-circle-check"></i> On-brand
          </span>
          <span className="cv-tag status">{STATUS_BADGE[status].label}</span>
        </span>
      </header>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            background: "var(--sw-white)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
          }}
        >
          <iframe title="partage" srcDoc={renderDocument(html)} style={{ width: "100%", height: "78vh", border: 0, display: "block" }} />
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--sw-slate-400)", marginTop: 16 }}>
          Partagé via la Sherweb Layer · lecture seule · contenu on-brand généré et validé.
        </p>
      </div>
    </main>
  );
}
