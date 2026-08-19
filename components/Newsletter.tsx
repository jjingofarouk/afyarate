"use client";

import { useState, useEffect } from "react";
import { OPPORTUNITY_TYPES } from "@/lib/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INITIAL_SHOW = 8;

type Status = "idle" | "loading" | "success" | "error";

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
  const selectedInFiltered = filtered.filter((o) => selectedSet.has(o));
  const unselectedInFiltered = filtered.filter((o) => !selectedSet.has(o));
  const visible = expanded
    ? filtered
    : [...selectedInFiltered, ...unselectedInFiltered.slice(0, Math.max(0, INITIAL_SHOW - selectedInFiltered.length))];
  const hiddenCount = filtered.length - visible.length;

  return (
    <div>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
      {searchable && options.length > INITIAL_SHOW && (
        <div className="relative mt-2">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
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
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-600 dark:hover:border-emerald-500"
          >
            +{hiddenCount} more
          </button>
        )}
        {expanded && !lq && hiddenCount === 0 && options.length > INITIAL_SHOW && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition hover:border-slate-400 dark:border-slate-600"
          >
            Show less
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export default function Newsletter({
  title = "Get new jobs in your inbox",
  description = "New nursing, midwifery, clinical and allied-health openings across Uganda, delivered to your inbox. Tell us what you want to hear about — no spam, unsubscribe anytime.",
  className = "",
  defaultTypes = [],
  defaultRoles = [],
  defaultEmail = "",
  roleOptions: roleOptionsProp,
  locationOptions: locationOptionsProp,
  onSuccess,
}: {
  title?: string;
  description?: string;
  className?: string;
  defaultTypes?: string[];
  defaultRoles?: string[];
  defaultEmail?: string;
  roleOptions?: string[];
  locationOptions?: string[];
  onSuccess?: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [types, setTypes] = useState<string[]>(defaultTypes);
  const [roles, setRoles] = useState<string[]>(defaultRoles);
  const [regions, setRegions] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>(roleOptionsProp ?? []);
  const [locationOptions, setLocationOptions] = useState<string[]>(locationOptionsProp ?? []);
  const [status, setStatus] = useState<Status>("idle");
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (roleOptionsProp !== undefined || locationOptionsProp !== undefined) return;
    fetch("/api/newsletter-options")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.professions)) setRoleOptions(d.professions);
        if (Array.isArray(d.locations)) setLocationOptions(d.locations);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss 2s after success animation completes
  useEffect(() => {
    if (status !== "success") return;
    const id = setTimeout(() => onSuccess?.(), 4000);
    return () => clearTimeout(id);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function clearError(key: string) {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    const errs: Record<string, string> = {};

    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";
    if (!EMAIL_RE.test(trimmed)) errs.email = "Enter a valid email address.";
    if (types.length === 0) errs.types = "Choose at least one opportunity type.";
    if (roles.length === 0) errs.roles = "Choose at least one role.";
    if (regions.length === 0) errs.regions = "Choose at least one location.";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setStatus("loading");
    setApiError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_address: trimmed,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          types,
          roles,
          regions,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setApiError(data?.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setApiError("Something went wrong. Please try again.");
    }
  }

  const baseInput =
    "w-full rounded-xl border bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";
  const okInput = `${baseInput} border-slate-300 focus:border-emerald-500 focus:ring-emerald-100 dark:border-slate-700 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40`;
  const errInput = `${baseInput} border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-600 dark:focus:ring-red-900/40`;

  return (
    <div className={className}>
      {title && (
        <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h3>
      )}
      {description && (
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      )}

      {status === "success" ? (
        <div className="check-pop flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <svg
              className="size-10 text-emerald-600 dark:text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path className="draw-check" d="M5 12l5 5L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 dark:text-slate-50">
              {firstName.trim() ? `You're in, ${firstName.trim()}!` : "You're subscribed!"}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              We&apos;ll email you matching opportunities as soon as they&apos;re posted.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-5" noValidate>
          <div className="grid max-w-xl grid-cols-2 gap-2">
            <div>
              <label htmlFor="nl-first-name" className="sr-only">First name</label>
              <input
                id="nl-first-name"
                type="text"
                name="firstName"
                autoComplete="given-name"
                placeholder="First name *"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearError("firstName"); }}
                className={fieldErrors.firstName ? errInput : okInput}
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="nl-last-name" className="sr-only">Last name</label>
              <input
                id="nl-last-name"
                type="text"
                name="lastName"
                autoComplete="family-name"
                placeholder="Last name *"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); clearError("lastName"); }}
                className={fieldErrors.lastName ? errInput : okInput}
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="max-w-xl">
            <label htmlFor="nl-email" className="sr-only">Email address</label>
            <input
              id="nl-email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com *"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
              className={fieldErrors.email ? errInput : okInput}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          {/* Sticky submit bar — always visible as user scrolls through chips */}
          <div className="sticky top-0 z-10 -mx-1 flex items-center gap-3 bg-white py-3 dark:bg-slate-900">
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe free →"}
            </button>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              No spam. Unsubscribe anytime.
            </p>
          </div>

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

          {apiError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {apiError}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
