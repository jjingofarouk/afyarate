"use client";

import { useState } from "react";
import HandleGate, { useHandle } from "@/components/HandleGate";

const input =
  "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";

export default function RegisterOrganizationPage() {
  const { profileId } = useHandle();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        website: website.trim(),
        description: description.trim(),
        ownerProfileId: profileId,
      }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
    setBusy(false);
    if (res.ok) {
      setName("");
      setWebsite("");
      setDescription("");
    }
    setMsg(res.ok ? (data?.message ?? "Registered") : (data?.error ?? "Failed"));
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Register organization</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Hospitals, NGOs, clinics and recruiters — register so you can post jobs and get a verified badge.
      </p>
      <div className="mt-6">
        <HandleGate prompt="Pick a display name to register your organization">
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Organization name" maxLength={180} className={input} />
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website (optional)" maxLength={255} className={input} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you do? (optional)" rows={4} maxLength={5000} className={input} />
            <button type="button" disabled={busy || !name.trim()} onClick={() => void submit()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? "…" : "Register"}
            </button>
            {msg && <p className="text-sm text-slate-600 dark:text-slate-400">{msg}</p>}
          </div>
        </HandleGate>
      </div>
    </div>
  );
}
