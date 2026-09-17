"use client";

import { useState } from "react";
import { getProfileId } from "@/lib/handle";

const REASONS = [
  "Asks for money to apply",
  "Looks like a scam",
  "Expired or closed",
  "Wrong or misleading details",
  "Duplicate listing",
  "Other",
];

// Structured listing report, shown from the safety guidance on a listing page.
export default function ListingReportButton({ postId }: { postId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (sent) {
    return (
      <p className="text-xs text-emerald-700 dark:text-emerald-400">
        Report received — thank you. Our moderators will review it.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-slate-400 underline hover:text-red-600"
      >
        Report this listing
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
      <p className="font-semibold">Report this listing</p>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
      >
        {REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Anything else the moderators should know (optional)"
        rows={3}
        maxLength={2000}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  kind: "listing",
                  postId,
                  reason,
                  details,
                  profileId: getProfileId() ?? undefined,
                }),
              });
              if (res.ok) setSent(true);
              else {
                const data = (await res.json().catch(() => ({}))) as { error?: string };
                setError(data.error ?? "Could not send the report.");
              }
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Send report
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
