"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Practitioner } from "@/lib/types";
import { SUPPORT_WHATSAPP } from "@/lib/site";

type Step = "search" | "preview" | "details" | "paying" | "done";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-amber-900/40";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-700 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
      <svg className="size-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M8 .5 L1.5 3.5 V8 c0 3.6 2.8 6.5 6.5 7 3.7-.5 6.5-3.4 6.5-7 V3.5 Z" />
        <path d="M5.5 8.25 L7 9.75 L10.5 6.25" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      Verified
    </span>
  );
}

function ProfileCard({ p }: { p: Practitioner }) {
  const ini = initials(p.name);
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-amber-400 bg-white dark:bg-slate-900">
      {/* top bar */}
      <div className="bg-amber-500 px-4 py-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-white">
        Your profile after claiming
      </div>

      <div className="p-5">
        {/* avatar + name row */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {p.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={p.imageUrl}
                alt={p.name}
                className="size-16 rounded-full border-2 border-amber-400 object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-100 text-xl font-extrabold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                {ini}
              </div>
            )}
            {/* badge overlay */}
            <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900">
              <svg className="size-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M4.5 8.5 L6.5 10.5 L11.5 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="min-w-0 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-slate-900 dark:text-slate-50">{p.name}</p>
              <VerifiedBadge />
            </div>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {p.profession ?? p.council}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{p.council}</p>
          </div>
        </div>

        {/* mock contact buttons */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" />
            </svg>
            Call
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
            <svg className="size-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M11.998 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.518 5.829L0 24l6.335-1.617A11.945 11.945 0 0011.998 24C18.623 24 24 18.627 24 12S18.623 0 11.998 0zm.002 21.818a9.806 9.806 0 01-5.001-1.371l-.361-.214-3.733.979.997-3.648-.234-.375A9.791 9.791 0 012.182 12c0-5.413 4.405-9.818 9.818-9.818 5.413 0 9.818 4.405 9.818 9.818 0 5.414-4.405 9.818-9.818 9.818z" />
            </svg>
            WhatsApp
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-slate-400 dark:text-slate-500">
          This is what patients will see
        </p>
      </div>
    </div>
  );
}

export default function ClaimFlow() {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Practitioner[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Practitioner | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editHref, setEditHref] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/practitioners?q=${encodeURIComponent(query.trim())}&pageSize=8&sort=name&status=all`);
        const data = await res.json();
        setResults(data.items ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function selectProfile(p: Practitioner) {
    setSelected(p);
    setName(p.name);
    setError(null);
    setStep("preview");
  }

  async function startPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practitionerId: selected.id, name, phone, email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setStep("paying");

      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts += 1;
        try {
          const s = await fetch(
            `/api/claims/${data.claimId}?phone=${encodeURIComponent(phone)}`
          );
          const sd = await s.json();
          if (sd.paid) {
            if (pollRef.current) clearInterval(pollRef.current);
            if (sd.editToken && sd.practitionerId) {
              setEditHref(
                `/practitioners/${sd.practitionerId}/edit?t=${encodeURIComponent(sd.editToken)}`
              );
            }
            setStep("done");
          } else if (sd.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setError("The payment did not go through. No money was taken. Please try again.");
            setStep("details");
          } else if (attempts > 60) {
            if (pollRef.current) clearInterval(pollRef.current);
            setError("Still waiting for your payment to confirm. If you entered your PIN, refresh this page in a minute.");
          }
        } catch { /* keep polling */ }
      }, 3000);
    } catch (err) {
      setError((err as Error).message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── SEARCH ── */
  if (step === "search") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Find your profile</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Search your name exactly as it appears on your licence.
        </p>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Nakato Sarah"
          className={`mt-4 ${inputClass}`}
        />
        {searching && <p className="mt-4 text-sm text-slate-400">Searching...</p>}
        {results.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => selectProfile(p)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{p.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {p.profession ?? p.council}, {p.council}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                    This is me
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!searching && query.trim().length >= 3 && results.length === 0 && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            No profiles matched &ldquo;{query}&rdquo;. Try a shorter part of your name.
          </p>
        )}
      </div>
    );
  }

  /* ── PREVIEW ── */
  if (step === "preview" && selected) {
    return (
      <div className="space-y-4">
        <ProfileCard p={selected} />

        {/* How it works */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-50">How it works</p>
          <ol className="mt-3 space-y-3">
            {[
              "Pay UGX 5,000 via mobile money (MTN or Airtel).",
              "Enter the phone number to receive the payment prompt.",
              "Approve with your PIN. Your profile is instantly claimed.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Price + CTA */}
        <div className="rounded-2xl border border-amber-200 bg-white px-5 py-4 dark:border-amber-900/40 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">One-time only</p>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">UGX 5,000</p>
              <p className="text-xs text-slate-400 line-through">UGX 9,900</p>
            </div>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="cta-glow rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600 active:bg-amber-700"
            >
              Pay to claim
            </button>
          </div>
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No subscriptions. No renewals. Yours forever after one payment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setStep("search"); setSelected(null); setQuery(""); setResults([]); }}
          className="mx-auto block text-sm text-slate-400 underline-offset-4 hover:text-slate-600 hover:underline dark:text-slate-500 dark:hover:text-slate-300"
        >
          Not me, search again
        </button>
      </div>
    );
  }

  /* ── DETAILS (enter phone for payment) ── */
  if (step === "details" && selected) {
    return (
      <form onSubmit={startPayment} className="rounded-2xl border border-amber-200 bg-white p-6 dark:border-amber-900/50 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Claiming</p>
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">{selected.name}</p>
            <p className="text-xs text-slate-400">{selected.profession ?? selected.council}</p>
          </div>
          <VerifiedBadge />
        </div>

        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Enter the mobile money number you want to pay from. We will send a prompt to that number.
        </p>

        <div className="grid gap-4">
          <div>
            <label htmlFor="claim-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Full name <span className="font-normal text-slate-400">(as on your licence)</span>
            </label>
            <input
              id="claim-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="claim-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Mobile money number
            </label>
            <input
              id="claim-phone"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 7xx xxx xxx"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="claim-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email <span className="font-normal text-slate-400">(optional, for your receipt)</span>
            </label>
            <input
              id="claim-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="cta-glow mt-5 w-full rounded-full bg-amber-500 px-6 py-3.5 text-base font-bold text-white transition hover:bg-amber-600 active:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Starting..." : "Pay UGX 5,000 and claim my profile"}
        </button>
        <button
          type="button"
          onClick={() => { setStep("preview"); setError(null); }}
          className="mx-auto mt-3 block text-sm text-slate-400 underline-offset-4 hover:text-slate-600 hover:underline dark:text-slate-500 dark:hover:text-slate-300"
        >
          Back
        </button>
      </form>
    );
  }

  /* ── PAYING ── */
  if (step === "paying") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex size-14 items-center justify-center">
          <span className="fab-ping absolute inline-flex size-14 rounded-full bg-amber-400/60" />
          <span className="relative inline-flex size-14 items-center justify-center rounded-full bg-amber-500 text-white">
            <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0" />
            </svg>
          </span>
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-50">Confirm on your phone</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          We sent a mobile money prompt to{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{phone}</span>.
          Enter your PIN to approve the UGX 5,000 payment.
        </p>
        <p className="mt-4 animate-pulse text-xs font-medium text-slate-400">
          Waiting for confirmation...
        </p>
      </div>
    );
  }

  /* ── DONE ── */
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <div className="check-pop mx-auto grid size-14 place-items-center rounded-full bg-emerald-600 text-white">
        <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path className="draw-check" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="mt-4 text-xl font-bold text-emerald-900 dark:text-emerald-300">Profile claimed!</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-emerald-800 dark:text-emerald-400">
        <span className="font-semibold">{selected?.name}</span> is now yours, forever.
        Add your phone, workplace, specialties and more so patients can find and reach you.
      </p>
      <p className="mx-auto mt-3 inline-flex max-w-md items-center gap-2 rounded-xl bg-white/70 px-4 py-2.5 text-xs font-semibold text-emerald-900 dark:bg-slate-900/60 dark:text-emerald-300">
        <svg className="size-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Paid in full. You will never be asked to pay again.
      </p>

      {editHref && (
        <Link
          href={editHref}
          className="cta-glow mx-auto mt-5 block w-full max-w-md rounded-full bg-amber-500 px-6 py-3.5 text-base font-bold text-white transition hover:bg-amber-600 active:bg-amber-700"
        >
          Add your details now — phone, workplace, specialties
        </Link>
      )}
      {!editHref && selected && (
        <Link
          href={`/practitioners/${selected.id}/edit`}
          className="cta-glow mx-auto mt-5 block w-full max-w-md rounded-full bg-amber-500 px-6 py-3.5 text-base font-bold text-white transition hover:bg-amber-600"
        >
          Add your details →
        </Link>
      )}

      {selected && (
        <Link
          href={`/practitioners/${selected.id}`}
          className="mt-3 inline-block rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-bold text-emerald-800 transition hover:border-emerald-400 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300"
        >
          View my profile →
        </Link>
      )}

      {/* Support */}
      <div className="mx-auto mt-6 max-w-sm rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Need help setting up?
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hi! I just claimed my Musawo profile and I need help adding my details.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12.04 2a9.9 9.9 0 00-8.51 14.94L2 22l5.2-1.49A9.9 9.9 0 1012.04 2zm4.47 12.96c-.25-.12-1.46-.72-1.68-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.79.97-.14.16-.29.19-.53.06a6.65 6.65 0 01-3.32-2.9c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.66-1.18.21-.57.21-1.06.15-1.18-.07-.11-.24-.18-.5-.3z" />
            </svg>
            WhatsApp us
          </a>
          <Link
            href="/contact"
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400 dark:border-slate-600 dark:text-slate-200"
          >
            Contact support
          </Link>
        </div>
        <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          We can even fill in your details for you.
        </p>
      </div>
    </div>
  );
}
