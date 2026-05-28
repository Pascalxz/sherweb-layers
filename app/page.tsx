import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-8">
        <p className="text-sm uppercase tracking-button text-sherweb-muted">
          Sherweb Layer
        </p>
        <h1 className="text-4xl md:text-5xl">
          More than a cloud distributor — an on-brand content layer.
        </h1>
        <p className="text-sherweb-body text-lg">
          Inject brand context, tone of voice, and governance into every generation.
          Real experts, strategic guidance, a team that works with you.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href="/login" className="btn-primary">Get started</Link>
          <Link href="/login" className="btn-secondary">Request discovery call</Link>
        </div>
      </div>
    </main>
  );
}
