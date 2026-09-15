"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Facility } from "@/lib/types";
import { SUPPORT_WHATSAPP } from "@/lib/site";

type Step = "search" | "preview" | "details" | "paying" | "done";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900/40";

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
      <svg className="size-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M8 .5 L1.5 3.5 V8 c0 3.6 2.8 6.5 6.5 7 3.7-.5 6.5-3.4 6.5-7 V3.5 Z" />
        <path d="M5.5 8.25 L7 9.75 L10.5 6.25" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      Verified
    </span>
  );
}

export default function FacilityClaimFlow() {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Facility[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editHref, setEditHref] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/facilities?q=${encodeURIComponent(query.trim())}&pageSize=8&sort=name`);
        const data = await res.json();
        setResults((data.items ?? []).filter((f: Facility) => !f.claimed));
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function selectFacility(f: Facility) {
    setSelected(f);
    setError(null);
    setStep("preview");
  }

  async function startPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/facility-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId: selected.id, name, phone, email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setStep("paying");

      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts += 1;
        try {
          const s = await fetch(
            `/api/facility-claims/${data.claimId}?phone=${encodeURIComponent(phone)}`
          );
          const sd = await s.json();
          if (sd.paid) {
            if (pollRef.current) clearInterval(pollRef.current);
            if (sd.editToken && sd.facilityId) {
              setEditHref(`/facilities/edit/${sd.facilityId}?t=${encodeURIComponent(sd.editToken)}`);
            }
            if (sd.slug) setSlug(sd.slug);
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

  if (step === "search") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Find your facility</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Search your hospital or pharmacy name exactly as listed.
        </p>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Mulago Hospital"
          className={`mt-4 ${inputClass}`}
        />
        {searching && <p className="mt-4 text-sm text-slate-400">Searching...</p>}
        {results.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
            {results.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => selectFacility(f)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{f.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {f.kind}{f.city ? ` · ${f.city}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    This is us
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!searching && query.trim().length >= 3 && results.length === 0 && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            No unclaimed facilities matched &ldquo;{query}&rdquo;. Try a shorter name, or contact us to add yours.
          </p>
        )}
      </div>
    );
  }

  if (step === "preview" && selected) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border-2 border-emerald-400 bg-white dark:bg-slate-900">
          <div className="bg-emerald-600 px-4 py-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-white">
            Your facility after claiming
          </div>
          <div className="flex items-center gap-4 p-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              {selected.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-bold text-slate-900 dark:text-slate-50">{selected.name}</p>
                <VerifiedBadge />
              </div>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {selected.kind}{selected.city ? ` · ${selected.city}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-50">How it works</p>
          <ol className="mt-3 space-y-3">
            {[
              "Pay UGX 5,000 via mobile money (MTN or Airtel).",
              "Enter the number to receive the payment prompt.",
              "Approve with your PIN. Your facility is instantly verified.",
            ].map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white px-5 py-4 dark:border-emerald-900/40 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">One-time only</p>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">UGX 5,000</p>
            </div>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Pay to claim
            </button>
          </div>
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            No subscriptions. No renewals. Verified forever after one payment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setStep("search"); setSelected(null); setQuery(""); setResults([]); }}
          className="mx-auto block text-sm text-slate-400 underline-offset-4 hover:underline"
        >
          Not us, search again
        </button>
      </div>
    );
  }

  if (step === "details" && selected) {
    return (
      <form onSubmit={startPayment} className="rounded-2xl border border-emerald-200 bg-white p-6 dark:border-emerald-900/50 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Claiming</p>
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">{selected.name}</p>
          </div>
          <VerifiedBadge />
        </div>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Enter your name and the mobile money number you want to pay from.
        </p>
        <div className="grid gap-4">
          <div>
            <label htmlFor="fclaim-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Your full name <span className="font-normal text-slate-400">(facility representative)</span>
            </label>
            <input id="fclaim-name" required value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label htmlFor="fclaim-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Mobile money number
            </label>
            <input id="fclaim-phone" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+256 7xx xxx xxx" className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label htmlFor="fclaim-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email <span className="font-normal text-slate-400">(optional, for your receipt)</span>
            </label>
            <input id="fclaim-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@facility.com" className={`mt-1.5 ${inputClass}`} />
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
          className="mt-5 w-full rounded-full bg-emerald-600 px-6 py-3.5 text-base font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "Starting..." : "Pay UGX 5,000 and claim this facility"}
        </button>
        <button type="button" onClick={() => { setStep("preview"); setError(null); }} className="mx-auto mt-3 block text-sm text-slate-400 underline-offset-4 hover:underline">
          Back
        </button>
      </form>
    );
  }

  if (step === "paying") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Confirm on your phone</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          We sent a mobile money prompt to <span className="font-semibold text-slate-900 dark:text-slate-100">{phone}</span>.
          Enter your PIN to approve the UGX 5,000 payment.
        </p>
        <p className="mt-4 animate-pulse text-xs font-medium text-slate-400">Waiting for confirmation...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-300">Facility verified!</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-emerald-800 dark:text-emerald-400">
        <span className="font-semibold">{selected?.name}</span> is now verified, forever.
        Add your phone, services, photo and more.
      </p>
      {editHref && (
        <Link href={editHref} className="mx-auto mt-5 block w-full max-w-md rounded-full bg-emerald-600 px-6 py-3.5 text-base font-bold text-white hover:bg-emerald-700">
          Add your details now
        </Link>
      )}
      {slug && (
        <Link href={`/facilities/${slug}`} className="mt-3 inline-block rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-bold text-emerald-800 hover:border-emerald-400 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300">
          View facility page →
        </Link>
      )}
      <div className="mx-auto mt-6 max-w-sm rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Need help?</p>
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hi! We just claimed our facility on Musawo and need help.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
        >
          WhatsApp us
        </a>
      </div>
    </div>
  );
}
