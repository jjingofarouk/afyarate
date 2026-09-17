"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import HandleGate, { useHandle } from "@/components/HandleGate";
import { useAuth } from "@/lib/auth-context";

interface OwnedListing {
  id: number;
  slug: string;
  title: string;
  organization: string;
  status: string;
  deadline: string | null;
  views: number;
  applicants: { total: number; byStatus: Record<string, number> };
}

interface Applicant {
  id: number;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  cover_note: string | null;
  cv_url: string | null;
  document_id: number | null;
  status: string;
  created_at: string;
}

const NEXT_STATUS = ["reviewing", "shortlisted", "rejected", "hired"] as const;

function csv(rows: Applicant[]): string {
  const esc = (v: string | null): string => `"${(v ?? "").replace(/"/g, '""')}"`;
  const head = "name,email,phone,status,applied,cover_note,cv_url";
  const lines = rows.map((a) =>
    [a.applicant_name, a.applicant_email, a.applicant_phone, a.status, a.created_at, a.cover_note, a.cv_url]
      .map((v) => esc(typeof v === "string" ? v : (v ?? "")))
      .join(","),
  );
  return [head, ...lines].join("\n");
}

function Pipeline() {
  const { profileId } = useHandle();
  const { authFetch } = useAuth();
  const [listings, setListings] = useState<OwnedListing[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    if (!profileId) return;
    const res = await authFetch(`/api/my-listings?profileId=${profileId}`);
    if (res.ok) {
      const data = (await res.json()) as { items: OwnedListing[] };
      setListings(data.items);
    }
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = async (postId: number) => {
    if (openId === postId) {
      setOpenId(null);
      return;
    }
    setOpenId(postId);
    setFilter("all");
    const res = await authFetch("/api/my-listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, postId }),
    });
    if (res.ok) {
      const data = (await res.json()) as { items: Applicant[] };
      setApplicants(data.items);
    }
  };

  const setStatus = async (applicationId: number, status: string) => {
    const res = await authFetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, profileId, status }),
    });
    if (res.ok && openId) {
      // Refresh applicant list in place.
      const r = await authFetch("/api/my-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, postId: openId }),
      });
      if (r.ok) {
        const data = (await r.json()) as { items: Applicant[] };
        setApplicants(data.items);
      }
      void load();
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([csv(applicants)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applicants-${openId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openVaultDoc = async (docId: number) => {
    if (!profileId) return;
    const res = await authFetch(`/api/documents?profileId=${profileId}&id=${docId}&download=1`);
    if (res.ok) {
      const data = (await res.json()) as { url: string };
      window.open(data.url, "_blank");
    }
  };

  const shown = filter === "all" ? applicants : applicants.filter((a) => a.status === filter);

  return (
    <div className="space-y-3">
      {listings.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No listings linked to this handle yet. Post one from{" "}
          <Link href="/posts/new" className="text-emerald-700 underline">Post a listing</Link>{" "}
          on this device and it will appear here for applicant management once published.
        </p>
      )}
      {listings.map((l) => (
        <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Link href={`/posts/${l.slug}`} className="font-semibold hover:underline">
                {l.title}
              </Link>
              <p className="text-sm text-slate-500">
                {l.views ?? 0} views · {l.applicants.total} applicant{l.applicants.total === 1 ? "" : "s"}
                {(l.views ?? 0) > 0 && l.applicants.total > 0 && (
                  <> · {Math.round((l.applicants.total / (l.views ?? 1)) * 100)}% apply rate</>
                )}
                {Object.entries(l.applicants.byStatus).map(([s, n]) => ` · ${s}: ${n}`).join("")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void open(l.id)}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold dark:bg-slate-800"
            >
              {openId === l.id ? "Close" : "Manage"}
            </button>
          </div>

          {openId === l.id && (
            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "submitted", "reviewing", "shortlisted", "rejected", "hired"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter(s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === s ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}
                  >
                    {s}
                  </button>
                ))}
                <button type="button" onClick={downloadCsv} className="ml-auto text-xs font-semibold text-emerald-700 hover:underline">
                  Export CSV
                </button>
              </div>
              {shown.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No applicants in this view.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {shown.map((a) => (
                    <li key={a.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold">{a.applicant_name}</span>{" "}
                          <a href={`mailto:${a.applicant_email}`} className="text-emerald-700 hover:underline">
                            {a.applicant_email}
                          </a>
                          {a.applicant_phone && <span className="text-slate-500"> · {a.applicant_phone}</span>}
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold dark:bg-slate-700">
                          {a.status}
                        </span>
                      </div>
                      {a.cover_note && <p className="mt-1 text-slate-600 dark:text-slate-400">{a.cover_note}</p>}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {NEXT_STATUS.filter((s) => s !== a.status).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => void setStatus(a.id, s)}
                            className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold hover:bg-emerald-50 dark:bg-slate-700"
                          >
                            → {s}
                          </button>
                        ))}
                        {a.cv_url && (
                          <a href={a.cv_url} target="_blank" rel="noopener noreferrer" className="rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:underline">
                            CV link ↗
                          </a>
                        )}
                        {a.document_id && (
                          <button
                            type="button"
                            onClick={() => void openVaultDoc(a.document_id as number)}
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            Vault doc ↗
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function EmployersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Employer workspace</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Listings you posted from this device, with every applicant, shortlisting and export in one place. Status changes notify applicants in-app.
      </p>
      <div className="mt-6">
        <HandleGate prompt="Pick a display name to open your employer workspace">
          <Pipeline />
        </HandleGate>
      </div>
    </div>
  );
}
