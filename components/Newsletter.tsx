"use client";

import { useState } from "react";
import {
  OPPORTUNITY_TYPES,
  ROLE_OPTIONS,
  REGION_OPTIONS,
} from "@/lib/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/**
 * Newsletter signup. Posts to /api/newsletter (server-side), which saves the
 * email, name and preference selections to the site's Supabase
 * newsletter_subscribers table so they can be emailed later.
 */
export default function Newsletter({
  title = "Get new jobs in your inbox",
  description = "New nursing, midwifery, clinical and allied-health openings across Uganda, delivered to your inbox. Tell us what you want to hear about — no spam, unsubscribe anytime.",
  className = "",
  defaultTypes = [],
  defaultRoles = [],
}: {
  title?: string;
  description?: string;
  className?: string;
  defaultTypes?: string[];
  defaultRoles?: string[];
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [types, setTypes] = useState<string[]>(defaultTypes);
  const [roles, setRoles] = useState<string[]>(defaultRoles);
  const [regions, setRegions] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    setMessage("");
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
        setMessage(
          firstName.trim()
            ? `You're subscribed, ${firstName.trim()}! We'll email you when new opportunities match your preferences.`
            : "You're subscribed! We'll email you when new opportunities match your preferences.",
        );
        setFirstName("");
        setLastName("");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data?.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40";

  return (
    <div className={className}>
      <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {title}
      </h3>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>

      {status === "success" ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {message}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <div className="grid max-w-xl grid-cols-2 gap-2">
            <div>
              <label htmlFor="newsletter-first-name" className="sr-only">
                First name
              </label>
              <input
                id="newsletter-first-name"
                type="text"
                name="firstName"
                autoComplete="given-name"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="newsletter-last-name" className="sr-only">
                Last name
              </label>
              <input
                id="newsletter-last-name"
                type="text"
                name="lastName"
                autoComplete="family-name"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex max-w-xl flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} flex-1`}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              What should we send you?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {OPPORTUNITY_TYPES.map((o) => (
                <Chip
                  key={o}
                  label={o}
                  selected={types.includes(o)}
                  onToggle={() => toggle(types, setTypes, o)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Roles you're interested in
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  selected={roles.includes(r)}
                  onToggle={() => toggle(roles, setRoles, r)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Where in Uganda?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {REGION_OPTIONS.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  selected={regions.includes(r)}
                  onToggle={() => toggle(regions, setRegions, r)}
                />
              ))}
            </div>
          </div>
        </form>
      )}

      {status === "error" && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {message}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        We'll only use your email to send job and opportunity alerts you asked for.
      </p>
    </div>
  );
}