import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppHome() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen px-6 py-16 max-w-4xl mx-auto space-y-8">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-button text-sherweb-muted">Sherweb Layer</p>
        <h1 className="text-3xl">Welcome{user?.email ? `, ${user.email}` : ""}</h1>
        <p className="text-sherweb-body">
          The generation pipeline arrives in Phase 2. For now: auth + database are wired.
        </p>
      </header>

      <section className="border border-sherweb-border rounded-sherweb p-6 bg-sherweb-bgAlt">
        <h2 className="text-xl mb-2">Status</h2>
        <ul className="space-y-1 text-sherweb-body">
          <li>✓ Magic link auth</li>
          <li>✓ Brand tokens wired into Tailwind</li>
          <li>○ contextBuilder + generations (Phase 2)</li>
          <li>○ Canvas editor (Phase 3)</li>
        </ul>
      </section>
    </main>
  );
}
