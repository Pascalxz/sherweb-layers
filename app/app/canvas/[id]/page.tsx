import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CanvasClient from "./CanvasClient";

export const dynamic = "force-dynamic";

export default async function CanvasPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();

  const { data: gen } = await supabase
    .from("generations")
    .select("id, output_html, edited_html")
    .eq("id", params.id)
    .single();

  if (!gen) notFound();

  // On édite la dernière version : edited_html si déjà retouché, sinon l'output original.
  const initialHtml = (gen.edited_html as string | null) ?? (gen.output_html as string);

  return <CanvasClient generationId={gen.id as string} initialHtml={initialHtml} />;
}
