"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StarInput from "./StarInput";

export default function FacilityRatingForm({ facilityId }: { facilityId: number }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setMessage({ kind: "err", text: "Please pick a star rating (1–5)." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/facilities/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId,
          rating,
          comment: comment.trim(),
          reviewerName: reviewerName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error ?? "Could not submit rating." });
        return;
      }
      setMessage({
        kind: "ok",
        text: "Thanks! Your rating has been recorded.",
      });
      setRating(0);
      setComment("");
      setReviewerName("");
      router.refresh();
    } catch {
      setMessage({ kind: "err", text: "Network error, please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        Rate this facility
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Public feedback on care, service, cleanliness and value. Keep it respectful and factual.
      </p>

      <div className="mt-4">
        <StarInput value={rating} onChange={setRating} />
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          Your name (optional)
        </label>
        <input
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          maxLength={80}
          placeholder="e.g. Patient, Kampala"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900/40"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          Comment (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Share your experience, waiting times, staff, cleanliness, availability of medicines…"
          className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900/40"
        />
      </div>

      {message && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            message.kind === "ok"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit rating"}
      </button>
    </form>
  );
}
