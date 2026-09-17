"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (!loading && user) {
    router.replace("/");
    return null;
  }

  const submit = async () => {
    setError("");
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "up" && !name.trim()) {
      setError("Pick a display name.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "in") {
        await signIn(email.trim(), password);
        router.replace("/");
      } else {
        const { needsConfirm } = await signUp(email.trim(), password, name.trim());
        if (needsConfirm) setSent(true);
        else router.replace("/");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800";

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "in" ? "Log in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "in"
            ? "Access your applications, vault and employer workspace."
            : "One account for applying, saving, messaging and hiring."}
        </p>

        {sent ? (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            Account created — check <strong>{email}</strong> for a confirmation link, then log in.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {mode === "up" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name e.g. Sarah N." maxLength={120} className={input} />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" autoComplete="email" className={input} />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (6+ characters)"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
              className={input}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "…" : mode === "in" ? "Log in" : "Create account"}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setError("");
            setSent(false);
          }}
          className="mt-3 text-sm font-semibold text-emerald-700 hover:underline"
        >
          {mode === "in" ? "New here? Create an account" : "Have an account? Log in"}
        </button>
        <p className="mt-3 text-xs text-slate-400">
          <Link href="/" className="underline">← Back home</Link>
        </p>
      </div>
    </div>
  );
}
