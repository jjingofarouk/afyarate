"use client";

import { useState } from "react";
import { OPPORTUNITY_TYPES } from "@/lib/newsletter";

const INITIAL_SHOW = 8;

type SaveStatus = "idle" | "loading" | "saved" | "error";
type UnsubStatus = "idle" | "confirm" | "loading" | "done";

export type Subscriber = {
  email: string;
  firstName: string;
  lastName: string;
  types: string[];
  roles: string[];
  regions: string[];
  status: string;
};

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        selected
          ? "border-emerald-500 bg-emerald-50 font-medium text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
      }`}
    >
      {label}
    </button>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
  searchable = false,
  error,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  searchable?: boolean;
  error?: string;
}) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(false);

  if (options.length === 0) return null;

  const lq = q.trim().toLowerCase();
  const filtered = lq ? options.filter((o) => o.toLowerCase().includes(lq)) : options;
  const selectedSet = new Set(selected);
  const selectedIn = filtered.filter((o) => selectedSet.has(o));
  const unselectedIn = filtered.filter((o) => !selectedSet.has(o));
  const visible = expanded
    ? filtered
    : [...selectedIn, ...unselectedIn.slice(0, Math.max(0, INITIAL_SHOW - selectedIn.length))];
  const hiddenCount = filtered.length - visible.length;

  return (
    <div>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
      {searchable && options.length > INITIAL_SHOW && (
        <div className="relative mt-2">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setExpanded(true); }}
            placeholder={`Search ${label.toLowerCase()}…`}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {visible.map((o) => (
          <Chip key={o} label={o} selected={selected.includes(o)} onToggle={() => onToggle(o)} />
        ))}
        {!expanded && hiddenCount > 0 && (
          <button type="button" onClick={() => setExpanded(true)}
            className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-600 dark:hover:border-emerald-500">
            +{hiddenCount} more
          </button>
        )}
        {expanded && !lq && options.length > INITIAL_SHOW && (
          <button type="button" onClick={() => setExpanded(false)}
            className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition hover:border-slate-400 dark:border-slate-600">
            Show less
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export default function ManageNewsletterForm({
  subscriber,
  roleOptions,
  locationOptions,
}: {
  subscriber: Subscriber;
  roleOptions: string[];
  locationOptions: string[];
}) {
  const [firstName, setFirstName] = useState(subscriber.firstName);
  const [lastName, setLastName] = useState(subscriber.lastName);
  const [types, setTypes] = useState<string[]>(subscriber.types);
  const [roles, setRoles] = useState<string[]>(subscriber.roles);
  const [regions, setRegions] = useState<string[]>(subscriber.regions);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [unsubStatus, setUnsubStatus] = useState<UnsubStatus>(
    subscriber.status === "unsubscribed" ? "done" : "idle",
  );
  const [unsubError, setUnsubError] = useState("");

  const isUnsubscribed = unsubStatus === "done";

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function clearError(key: string) {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";
    if (types.length === 0) errs.types = "Choose at least one type.";
    if (roles.length === 0) errs.roles = "Choose at least one role.";
    if (regions.length === 0) errs.regions = "Choose at least one location.";
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setFieldErrors({});
    setSaveStatus("loading");
    setSaveError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_address: subscriber.email,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          types,
          roles,
          regions,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3500);
      } else {
        setSaveStatus("error");
        setSaveError(data?.error ?? "Failed to save. Please try again.");
      }
    } catch {
      setSaveStatus("error");
      setSaveError("Failed to save. Please try again.");
    }
  }

  async function handleUnsubscribe() {
    if (unsubStatus === "idle") { setUnsubStatus("confirm"); return; }
    if (unsubStatus !== "confirm") return;
    setUnsubStatus("loading");
    setUnsubError("");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscriber.email }),
      });
      if (res.ok) {
        setUnsubStatus("done");
      } else {
        setUnsubStatus("confirm");
        setUnsubError("Something went wrong. Please try again.");
      }
    } catch {
      setUnsubStatus("confirm");
      setUnsubError("Something went wrong. Please try again.");
    }
  }

  const baseInput = "w-full rounded-xl border bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";
  const okInput = `${baseInput} border-slate-300 focus:border-emerald-500 focus:ring-emerald-100 dark:border-slate-700 dark:focus:border-emerald-500`;
  const errInput = `${baseInput} border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-600`;

  return (
    <div className="min-h-dvh bg-slate-50 pb-16 dark:bg-slate-950">
      {/* Brand header */}
      <header className="bg-[#0f4c24] px-6 py-5 text-center">
        <a href="/" className="inline-flex flex-col items-center gap-1 no-underline">
          <span className="text-lg font-bold tracking-tight text-white">Rate Musawo</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
            Uganda's Health Worker Hub
          </span>
        </a>
      </header>

      <div className="mx-auto max-w-xl px-4 py-8">

        {isUnsubscribed ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
            <p className="text-4xl">👋</p>
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-50">You're unsubscribed</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              We've removed <strong>{subscriber.email}</strong> from our mailing list.
              You won't receive any more alerts from us.
            </p>
            <a
              href="/"
              className="mt-6 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Back to Rate Musawo
            </a>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Your newsletter preferences
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Subscribed as <strong className="text-slate-700 dark:text-slate-300">{subscriber.email}</strong>
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
              {/* Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="mn-first" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    First name *
                  </label>
                  <input
                    id="mn-first"
                    type="text"
                    autoComplete="given-name"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); clearError("firstName"); }}
                    className={fieldErrors.firstName ? errInput : okInput}
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="mn-last" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Last name *
                  </label>
                  <input
                    id="mn-last"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); clearError("lastName"); }}
                    className={fieldErrors.lastName ? errInput : okInput}
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Chips */}
              <ChipGroup
                label="What should we send you? *"
                options={[...OPPORTUNITY_TYPES]}
                selected={types}
                onToggle={(v) => { toggle(types, setTypes, v); clearError("types"); }}
                error={fieldErrors.types}
              />
              <ChipGroup
                label="Roles you're interested in *"
                options={roleOptions}
                selected={roles}
                onToggle={(v) => { toggle(roles, setRoles, v); clearError("roles"); }}
                searchable
                error={fieldErrors.roles}
              />
              <ChipGroup
                label="Where in Uganda? *"
                options={locationOptions}
                selected={regions}
                onToggle={(v) => { toggle(regions, setRegions, v); clearError("regions"); }}
                searchable
                error={fieldErrors.regions}
              />

              {saveError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {saveError}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saveStatus === "loading"}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saveStatus === "loading" ? "Saving…" : "Save preferences"}
                </button>
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </span>
                )}
              </div>
            </form>

            {/* Unsubscribe section */}
            <div className="mt-6 rounded-2xl border border-red-100 bg-white p-6 shadow-sm dark:border-red-900/30 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">Unsubscribe</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                You won't receive any more emails from Rate Musawo.
              </p>

              {unsubStatus === "confirm" && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                  Are you sure? You'll stop receiving all job and opportunity alerts.
                </p>
              )}
              {unsubError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{unsubError}</p>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleUnsubscribe}
                  disabled={unsubStatus === "loading"}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                    unsubStatus === "confirm"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                  }`}
                >
                  {unsubStatus === "loading"
                    ? "Unsubscribing…"
                    : unsubStatus === "confirm"
                    ? "Yes, unsubscribe me"
                    : "Unsubscribe"}
                </button>
                {unsubStatus === "confirm" && (
                  <button
                    type="button"
                    onClick={() => setUnsubStatus("idle")}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
