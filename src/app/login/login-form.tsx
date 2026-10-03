"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ kind: "error", text: error.message });
        setBusy(false);
        return;
      }
      router.replace("/today");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage({ kind: "error", text: error.message });
    } else if (data.session) {
      router.replace("/welcome");
      router.refresh();
      return;
    } else {
      setMessage({ kind: "info", text: "Check your inbox to confirm your email, then sign in." });
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-7">
      <div>
        <h1 className="font-display text-3xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "signin" ? "Pick up where you left off." : "Free, and it takes under a minute."}
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm text-muted">Email</span>
        <input
          className="input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm text-muted">Password</span>
        <input
          className="input"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "signup" && <span className="text-xs text-muted">At least 8 characters.</span>}
      </label>

      {message && (
        <p role="alert" className={`text-sm ${message.kind === "error" ? "text-hard" : "text-easy"}`}>
          {message.text}
        </p>
      )}

      <button className="btn btn-arc w-full" disabled={busy}>
        {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      <button
        type="button"
        className="w-full text-sm text-muted hover:text-text"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMessage(null);
        }}
      >
        {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
    </form>
  );
}
