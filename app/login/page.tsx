"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function sendMagicLink() {
    setStatus("sending");
    setErrorMsg(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-button text-sherweb-muted">Sign in</p>
          <h1 className="text-3xl">Welcome back</h1>
          <p className="text-sherweb-body">A magic link will arrive in your inbox.</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full border border-sherweb-border rounded-sherweb px-4 py-3 focus:outline-none focus:border-sherweb-primary"
          />
          <button
            onClick={sendMagicLink}
            disabled={!email || status === "sending"}
            className="btn-primary w-full disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
        </div>

        {status === "sent" && (
          <p className="text-center text-sherweb-primary">
            Check your inbox — the link expires in 1 hour.
          </p>
        )}
        {status === "error" && (
          <p className="text-center text-sherweb-accent">{errorMsg}</p>
        )}
      </div>
    </main>
  );
}
