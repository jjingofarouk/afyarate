"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import HandleGate, { useHandle } from "@/components/HandleGate";
import { useAuth } from "@/lib/auth-context";

interface MyApp {
  id: number;
  post_id: number;
  applicant_name: string;
  cover_note: string | null;
  status: string;
  created_at: string;
  document_id: number | null;
  post: { id: number; slug: string; title: string; organization: string } | null;
}

interface VaultDoc {
  id: number;
  label: string;
  kind: string;
  mime_type: string | null;
  size_bytes: number;
  created_at: string;
}

const STATUS_TONE: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  reviewing: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  shortlisted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  hired: "bg-emerald-600 text-white",
};

function Dashboard() {
  const { profileId } = useHandle();
  const { authFetch } = useAuth();
  const [apps, setApps] = useState<MyApp[]>([]);
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState("cv");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!profileId) return;
    const [aRes, dRes] = await Promise.all([
      authFetch(`/api/applications?profileId=${profileId}`),
      authFetch(`/api/documents?profileId=${profileId}`),
    ]);
    if (aRes.ok) {
      const data = (await aRes.json()) as { items: MyApp[] };
      setApps(data.items);
    }
    if (dRes.ok) {
      const data = (await dRes.json()) as { items: VaultDoc[] };
      setDocs(data.items);
    }
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async () => {
    if (!file || !profileId) return;
    setBusy(true);
    setMsg("");
    const form = new FormData();
    form.set("file", file);
    form.set("profileId", profileId);
    form.set("label", label || file.name);
    form.set("kind", kind);
    const res = await authFetch("/api/documents", { method: "POST", body: form });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (res.ok) {
      setFile(null);
      setLabel("");
      void load();
    } else {
      setMsg(data?.error ?? "Upload failed");
    }
  };

  const remove = async (id: number) => {
    if (!profileId) return;
    const res = await authFetch(`/api/documents?profileId=${profileId}&id=${id}`, { method: "DELETE" });
    if (res.ok) void load();
  };

  const openDoc = async (id: number) => {
    if (!profileId) return;
    const res = await authFetch(`/api/documents?profileId=${profileId}&id=${id}&download=1`);
    if (res.ok) {
      const data = (await res.json()) as { url: string };
      window.open(data.url, "_blank");
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold">My applications ({apps.length})</h2>
        {apps.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Nothing yet. <Link href="/posts" className="text-emerald-700 underline">Browse listings</Link> and apply on-platform to track everything here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {apps.map((a) => (
              <li key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    {a.post ? (
                      <Link href={`/posts/${a.post.slug}`} className="font-semibold hover:underline">
                        {a.post.title}
                      </Link>
                    ) : (
                      <span className="font-semibold">Listing #{a.post_id}</span>
                    )}
                    {a.post && <p className="text-sm text-slate-500">{a.post.organization}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_TONE[a.status] ?? STATUS_TONE.submitted}`}>
                    {a.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Applied {new Date(a.created_at).toLocaleDateString()}
                  {a.document_id ? ` · vault doc #${a.document_id} attached` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Document vault</h2>
        <p className="mt-1 text-sm text-slate-500">
          Store your CV, certificates and licences once — attach them to any application in one tap. PDF, Word or images, 5 MB max.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label e.g. CV 2026"
            maxLength={120}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
            <option value="cv">CV</option>
            <option value="certificate">Certificate</option>
            <option value="licence">Licence</option>
            <option value="transcript">Transcript</option>
            <option value="other">Other</option>
          </select>
          <button type="button" disabled={busy || !file} onClick={() => void upload()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "…" : "Upload"}
          </button>
        </div>
        {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
        {docs.length > 0 && (
          <ul className="mt-3 space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <span className="font-semibold">{d.label}</span>{" "}
                  <span className="text-xs text-slate-400">({d.kind}{(d.size_bytes ? ` · ${Math.round(d.size_bytes / 1024)} KB` : "")})</span>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => void openDoc(d.id)} className="font-semibold text-emerald-700 hover:underline">
                    Open
                  </button>
                  <button type="button" onClick={() => void remove(d.id)} className="font-semibold text-slate-400 hover:text-red-600">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">My applications</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Track every on-platform application and keep your documents ready.
      </p>
      <div className="mt-6">
        <HandleGate prompt="Pick a display name to open your workspace">
          <Dashboard />
        </HandleGate>
      </div>
    </div>
  );
}
