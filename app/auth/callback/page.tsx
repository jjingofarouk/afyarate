"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";

// Landing page for Supabase email links (confirm signup, magic links).
// Runs in the browser because the PKCE code verifier lives in localStorage —
// a server route could not exchange the code. Always lands on the same
// environment the link was requested from (no more localhost in production).
function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    const err = params.get("error_description") ?? params.get("error");
    if (err) {
      setError(decodeURIComponent(err).replace(/\+/g, " "));
      return;
    }

    // Creating the browser client is itself part of the flow: supabase-js
    // parses `#access_token=...` from the URL hash (detectSessionInUrl), which
    // is what the default email template produces. So instantiate first, then
    // decide which exchange path applies.
    const sb = createBrowserClient();

    const done = () => router.replace("/");

    if (code) {
      sb.auth
        .exchangeCodeForSession(code)
        .then(({ error: exErr }) => (exErr ? setError(exErr.message) : done()))
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Confirmation failed."));
      return;
    }

    if (tokenHash) {
      // Newer email templates: verify the hashed token directly (no PKCE
      // verifier needed, so this also works if the link opens in a different
      // browser or device than the one that signed up).
      sb.auth
        .verifyOtp({
          token_hash: tokenHash,
          type: (type as "signup" | "email" | "recovery" | "invite" | "email_change") ?? "email",
        })
        .then(({ error: otpErr }) => (otpErr ? setError(otpErr.message) : done()))
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Confirmation failed."));
      return;
    }

    // No visible query params: the hash flow may have already established the
    // session when the client was created. Only report an error if it did not.
    sb.auth.getSession().then(({ data }) => {
      if (data.session) done();
      else
        setError(
          "This link is missing its confirmation code. Request a new one from the login page.",
        );
    });
  }, [params, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
          <p className="font-semibold">Confirmation link didn&apos;t work</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{error}</p>
          <Link href="/login" className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            Back to login
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-md px-4 py-14 text-center">
      <p className="text-sm text-slate-500">Confirming your email…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
