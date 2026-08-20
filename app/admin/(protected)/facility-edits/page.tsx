"use client";

import { useEffect, useState } from "react";
import { adminJson } from "@/lib/admin-client";

interface Edit {
  id: number;
  facilityId: number;
  facilityName: string | null;
  suggestedDescription: string | null;
  suggestedServices: string[] | null;
  suggestedPhone: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  createdAt: string;
}

export default function FacilityEditsAdminPage() {
  const [edits, setEdits] = useState<Edit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await adminJson<{ edits: Edit[] }>("/api/admin/facility-edits");
      setEdits(data.edits);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: number, action: "approve" | "reject") {
    setBusyId(id);
    try {
      await adminJson(`/api/admin/facility-edits/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      setEdits((list) => list.filter((e) => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
        Facility detail updates, pending review ({edits.length})
      </h1>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : edits.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Nothing pending.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {edits.map((e) => (
            <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {e.facilityName ?? `Facility #${e.facilityId}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {e.submittedByName || "Anonymous"}
                    {e.submittedByEmail ? ` · ${e.submittedByEmail}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    disabled={busyId === e.id}
                    onClick={() => review(e.id, "approve")}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busyId === e.id}
                    onClick={() => review(e.id, "reject")}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {e.suggestedDescription && (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  <strong>Description:</strong> {e.suggestedDescription}
                </p>
              )}
              {e.suggestedServices && e.suggestedServices.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.suggestedServices.map((s) => (
                    <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {e.suggestedPhone && (
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  <strong>Phone:</strong> {e.suggestedPhone}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
