"use client";

import { useState } from "react";

export default function FacilitySuggestEditForm({ slug }: { slug: string }) {
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function addService() {
    const v = serviceInput.trim();
    if (!v || services.includes(v)) return;
    setServices((s) => [...s, v]);
    setServiceInput("");
  }

  function removeService(v: string) {
    setServices((s) => s.filter((x) => x !== v));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() && services.length === 0 && !phone.trim()) {
      setMessage({ kind: "err", text: "Add at least one update before submitting." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/facilities/${slug}/suggest-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          services,
          phone: phone.trim(),
          name: name.trim(),
          email: email.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error ?? "Could not submit update." });
        return;
      }
      setMessage({
        kind: "ok",
        text: "Thanks! Your update has been sent for review and will go live once approved.",
      });
      setDescription("");
      setPhone("");
      setServices([]);
      setName("");
      setEmail("");
    } catch {
      setMessage({ kind: "err", text: "Network error, please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900/40";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        Run this facility? Update its details
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Suggest services, a description or a corrected phone number. A team member reviews every
        update before it goes live, nothing is published automatically.
      </p>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          Services offered
        </label>
        <div className="flex gap-2">
          <input
            value={serviceInput}
            onChange={(e) => setServiceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addService();
              }
            }}
            placeholder="e.g. Maternity ward, Radiology"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addService}
            className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"
          >
            Add
          </button>
        </div>
        {services.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {services.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeService(s)}
                  aria-label={`Remove ${s}`}
                  className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1500}
          rows={3}
          placeholder="What should patients know about this facility?"
          className={`resize-y ${inputClass}`}
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          Correct phone number
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+256…"
          className={inputClass}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Your name (optional)"
          className={inputClass}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Your email (optional)"
          className={inputClass}
        />
      </div>

      {message && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
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
        {submitting ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
