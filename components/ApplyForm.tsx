"use client";

import { useEffect, useState } from "react";
import { getProfileId } from "@/lib/handle";
import { useAuth } from "@/lib/auth-context";

interface VaultDoc {
  id: number;
  label: string;
  kind: string;
}

// In-platform application form: submits to /api/applications (one per email
// per listing). Carries the applicant handle when present so the application
// shows up in their /applications dashboard, and can attach a vault document.
export default function ApplyForm({ postId }: { postId: number }) {
  const { authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cover, setCover] = useState("");
  const [vault, setVault] = useState<VaultDoc[]>([]);
  const [docId, setDocId] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const pid = getProfileId();
    if (!pid) return;
    void authFetch(`/api/documents?profileId=${pid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items: VaultDoc[] } | null) => setVault(data?.items ?? []))
      .catch(() => {});
  }, [open ]);

  const submit = async () => {
    if (!name.trim() || !email.trim()) return;
    setBusy(true);
    setMsg("");
    const res = await authFetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        applicantName: name.trim(),
        applicantEmail: email.trim(),
        applicantPhone: phone.trim(),
        coverNote: cover.trim(),
        profileId: getProfileId(),
        documentId: docId ? Number(docId) : null,
      }),
    });
    const data = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
    setBusy(false);
    if (res.ok) {
      setName("");
      setEmail("");
      setPhone("");
      setCover("");
      setDocId("");
      setOpen(false);
    }
    setMsg(res.ok ? (data?.message ?? "Submitted") : (data?.error ?? "Failed"));
  };

  const input =
    "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";

  if (!open) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
        >
          Apply on this platform
        </button>
        {msg && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold">Apply on this platform</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={120} className={input} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" maxLength={200} className={input} />
      </div>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" maxLength={40} className={`${input} mt-2`} />
      <textarea value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Cover note (optional)" rows={3} maxLength={5000} className={`${input} mt-2`} />
      {vault.length > 0 && (
        <select value={docId} onChange={(e) => setDocId(e.target.value)} className={`${input} mt-2`}>
          <option value="">Attach a vault document (optional)</option>
          {vault.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label} ({d.kind})
            </option>
          ))}
        </select>
      )}
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={busy || !name.trim() || !email.trim()} onClick={() => void submit()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "…" : "Submit application"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold dark:bg-slate-800">
          Cancel
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{msg}</p>}
    </div>
  );
}
