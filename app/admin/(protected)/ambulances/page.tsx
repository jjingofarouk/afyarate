"use client";

import { useEffect, useState } from "react";
import { adminJson } from "@/lib/admin-client";

interface Provider {
  id: number;
  name: string;
  phone: string;
  city: string | null;
  coverageArea: string | null;
  vehicleTypes: string[];
  services: string[];
  description: string | null;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  createdAt: string;
}

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

export default function AmbulancesAdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("pending");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load(status: string) {
    setLoading(true);
    try {
      const data = await adminJson<{ providers: Provider[] }>(`/api/admin/ambulances?status=${status}`);
      setProviders(data.providers);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(tab);
  }, [tab]);

  async function act(id: number, action: "approve" | "reject" | "feature" | "unfeature") {
    setBusyId(id);
    try {
      await adminJson(`/api/admin/ambulances/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      if (action === "approve" || action === "reject") {
        setProviders((list) => list.filter((p) => p.id !== id));
      } else {
        setProviders((list) =>
          list.map((p) => (p.id === id ? { ...p, featured: action === "feature" } : p)),
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Ambulance providers</h1>

      <div className="mt-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              tab === t.key
                ? "bg-emerald-600 text-white"
                : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : providers.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Nothing here.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {providers.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {p.name} {p.featured && <span className="ml-1 text-amber-600">★ Featured</span>}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {p.phone}
                    {p.city ? ` · ${p.city}` : ""}
                    {p.coverageArea ? ` · Covers ${p.coverageArea}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {tab === "pending" && (
                    <>
                      <button
                        disabled={busyId === p.id}
                        onClick={() => act(p.id, "approve")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busyId === p.id}
                        onClick={() => act(p.id, "reject")}
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {tab === "approved" && (
                    <button
                      disabled={busyId === p.id}
                      onClick={() => act(p.id, p.featured ? "unfeature" : "feature")}
                      className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:text-amber-400"
                    >
                      {p.featured ? "Unfeature" : "Feature"}
                    </button>
                  )}
                </div>
              </div>
              {p.description && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{p.description}</p>
              )}
              {(p.vehicleTypes.length > 0 || p.services.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[...p.vehicleTypes, ...p.services].map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
