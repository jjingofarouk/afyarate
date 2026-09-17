"use client";

import { useCallback, useEffect, useState } from "react";
import HandleGate, { useHandle } from "@/components/HandleGate";
import { useAuth } from "@/lib/auth-context";
import type { SeekerProfile } from "@/lib/types";
import { Check } from "lucide-react";

const input =
  "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";

function MyProfile() {
  const { profileId } = useHandle();
  const { authFetch } = useAuth();
  const [form, setForm] = useState({
    seekingTitle: "",
    availability: "",
    desiredRoles: "",
    desiredLocations: "",
    employmentPreference: "",
    skills: "",
    expectedSalary: "",
    publicSummary: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    void authFetch(`/api/seeker-profile?profileId=${profileId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { profile: SeekerProfile | null } | null) => {
        const p = data?.profile;
        if (p) {
          setForm({
            seekingTitle: p.seekingTitle ?? "",
            availability: p.availability ?? "",
            desiredRoles: p.desiredRoles ?? "",
            desiredLocations: p.desiredLocations ?? "",
            employmentPreference: p.employmentPreference ?? "",
            skills: p.skills ?? "",
            expectedSalary: p.expectedSalary ?? "",
            publicSummary: p.publicSummary ?? "",
          });
        }
      })
      .catch(() => {});
  }, [profileId]);

  const save = async () => {
    const res = await authFetch("/api/seeker-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, ...form, active: true }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-semibold">My &ldquo;open to work&rdquo; profile</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input value={form.seekingTitle} onChange={set("seekingTitle")} placeholder="Title e.g. Enrolled Nurse" maxLength={180} className={input} />
        <input value={form.availability} onChange={set("availability")} placeholder="Availability e.g. Immediate" maxLength={100} className={input} />
        <input value={form.desiredRoles} onChange={set("desiredRoles")} placeholder="Desired roles" maxLength={500} className={input} />
        <input value={form.desiredLocations} onChange={set("desiredLocations")} placeholder="Desired locations" maxLength={500} className={input} />
        <input value={form.employmentPreference} onChange={set("employmentPreference")} placeholder="Full-time / Contract…" maxLength={180} className={input} />
        <input value={form.expectedSalary} onChange={set("expectedSalary")} placeholder="Expected salary (optional)" maxLength={180} className={input} />
      </div>
      <textarea value={form.skills} onChange={set("skills")} placeholder="Skills" rows={2} maxLength={800} className={`${input} mt-2`} />
      <textarea value={form.publicSummary} onChange={set("publicSummary")} placeholder="Short public summary" rows={3} maxLength={3000} className={`${input} mt-2`} />
      <button type="button" onClick={() => void save()} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
        Save profile
      </button>
      {saved && <span className="ml-3 text-sm text-emerald-600">Saved <Check className="inline size-4 align-[-0.125em]" aria-hidden /></span>}
    </div>
  );
}

function Directory() {
  const [items, setItems] = useState<SeekerProfile[]>([]);
  useEffect(() => {
    void fetch("/api/seeker-directory")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items: SeekerProfile[] } | null) => setItems(data?.items ?? []))
      .catch(() => {});
  }, []);
  if (items.length === 0) return <p className="text-sm text-slate-500">No open-to-work profiles yet.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((s) => (
        <div key={s.profileId} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold">{s.profile?.displayName ?? "Member"}</p>
          {s.seekingTitle && <p className="text-sm text-emerald-700">{s.seekingTitle}</p>}
          {s.publicSummary && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.publicSummary}</p>}
          <p className="mt-1 text-xs text-slate-400">
            {[s.profile?.cadre, s.profile?.location, s.availability].filter(Boolean).join(" · ")}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function SeekingPage() {
  const [tab, setTab] = useState<"directory" | "mine">("directory");
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Jobseekers</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Health workers open to work — employers can browse and reach out.
      </p>
      <div className="mt-4 flex gap-2">
        {(["directory", "mine"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === t ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}
          >
            {t === "directory" ? "Directory" : "My profile"}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "directory" ? (
          <Directory />
        ) : (
          <HandleGate prompt="Pick a display name to create your seeker profile">
            <MyProfile />
          </HandleGate>
        )}
      </div>
    </div>
  );
}
