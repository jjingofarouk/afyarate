"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900/40";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function ProfileDetailsForm({
  practitionerId,
  token,
  name,
}: {
  practitionerId: number;
  token: string;
  name: string;
}) {
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/profile-details/${practitionerId}?t=${encodeURIComponent(token)}`
        );
        if (!res.ok) throw new Error("This edit link is not valid.");
        const data = await res.json();
        const d = data.details ?? {};
        setPhone(d.phone ?? "");
        setWhatsapp(d.whatsapp ?? "");
        setWorkplace(d.workplace ?? "");
        setBio(d.bio ?? "");
        setSpecialties(Array.isArray(d.specialties) ? d.specialties.join(", ") : "");
        setWebsite(d.website ?? "");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [practitionerId, token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/profile-details/${practitionerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          phone,
          whatsapp,
          workplace,
          bio,
          specialties,
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading your details…</p>;
  }

  if (error && !phone && !bio && !workplace) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
        Your profile details
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Everything you add here appears on <span className="font-semibold">{name}</span>&apos;s
        public profile. Add as much as you like — you can update it any time.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="pd-phone" className={labelClass}>Phone (shown to patients)</label>
          <input id="pd-phone" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+256 7xx xxx xxx" className={`mt-1.5 ${inputClass}`} />
        </div>
        <div>
          <label htmlFor="pd-wa" className={labelClass}>WhatsApp number</label>
          <input id="pd-wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="Same as phone? Just repeat it" className={`mt-1.5 ${inputClass}`} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pd-work" className={labelClass}>Where you work</label>
          <input id="pd-work" value={workplace} onChange={(e) => setWorkplace(e.target.value)}
            placeholder="e.g. Mulago National Referral Hospital, Kampala" className={`mt-1.5 ${inputClass}`} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pd-spec" className={labelClass}>
            Specialties <span className="font-normal text-slate-400">(comma separated)</span>
          </label>
          <input id="pd-spec" value={specialties} onChange={(e) => setSpecialties(e.target.value)}
            placeholder="e.g. Paediatrics, Malaria, Antenatal care" className={`mt-1.5 ${inputClass}`} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pd-bio" className={labelClass}>About you</label>
          <textarea id="pd-bio" rows={5} value={bio} onChange={(e) => setBio(e.target.value)}
            placeholder="Tell patients about your experience, languages you speak, visiting hours…"
            className={`mt-1.5 ${inputClass} resize-y`} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pd-web" className={labelClass}>Website or social link <span className="font-normal text-slate-400">(optional)</span></label>
          <input id="pd-web" type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://…" className={`mt-1.5 ${inputClass}`} />
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}
      {saved && (
        <div className="check-pop mt-5 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Saved — your profile is updated live.
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save my details"}
      </button>

      <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
        Registry facts (name, licence, status) stay exactly as published by your council.
      </p>
    </form>
  );
}

export function SupportLinks() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Need help?</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Our team can fill in your details for you, fix a mistake, or add a photo.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "256700000000"}?text=${encodeURIComponent(
            "Hi! I just claimed my Musawo profile and I need help setting it up."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12.04 2a9.9 9.9 0 00-8.51 14.94L2 22l5.2-1.49A9.9 9.9 0 1012.04 2zm0 18.06a8.1 8.1 0 01-4.13-1.13l-.3-.18-3.08.88.9-3-.2-.31a8.14 8.14 0 01-1.25-4.35 8.16 8.16 0 0113.92-5.77 8.12 8.12 0 012.38 5.77 8.18 8.18 0 01-8.24 8.09zm4.47-6.1c-.25-.12-1.46-.72-1.68-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.79.97-.14.16-.29.19-.53.06a6.65 6.65 0 01-3.32-2.9c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.66-1.18.21-.57.21-1.06.15-1.18-.07-.11-.24-.18-.5-.3z" />
          </svg>
          WhatsApp support
        </a>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
