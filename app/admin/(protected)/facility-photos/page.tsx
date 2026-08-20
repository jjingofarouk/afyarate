"use client";

import { useEffect, useState } from "react";
import { adminJson } from "@/lib/admin-client";

interface Photo {
  id: number;
  imageUrl: string;
  facilityId: number;
  facilityName: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  createdAt: string;
}

export default function FacilityPhotosAdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await adminJson<{ photos: Photo[] }>("/api/admin/facility-photos");
      setPhotos(data.photos);
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
      await adminJson(`/api/admin/facility-photos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      setPhotos((list) => list.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
        Facility photos, pending review ({photos.length})
      </h1>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : photos.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Nothing pending.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt="" className="aspect-video w-full rounded-xl object-cover" />
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {p.facilityName ?? `Facility #${p.facilityId}`}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {p.submittedByName || "Anonymous"}
                {p.submittedByEmail ? ` · ${p.submittedByEmail}` : ""}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  disabled={busyId === p.id}
                  onClick={() => review(p.id, "approve")}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={busyId === p.id}
                  onClick={() => review(p.id, "reject")}
                  className="flex-1 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
