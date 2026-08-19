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
 * EmailOctopus newsletter signup. Posts to /api/newsletter (server-side, so
 * the API key never reaches the browser) and shows inline success/error
 * states. Preferences are stored as EmailOctopus tags (opportunity types) and
 * custom fields (roles, regions) so the list can be segmented for campaigns.
 */
export default function Newsletter({
  title = "Get new jobs in your inbox",
  description = "New nursing, midwifery, clinical and allied-health openings across Uganda, delivered to your inbox. Tell us what you want to hear about. No spam, unsubscribe anytime.",
  className = "",
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
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
          tags: types,
          fields: {
            ...(roles.length > 0 ? { Roles: roles.join(", ") } : {}),
            ...(regions.length > 0 ? { Regions: regions.join(", ") } : {}),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setMessage(
          data?.double_opt_in
            ? "Almost there — check your inbox and confirm your subscription to start receiving job alerts."
            : "You're subscribed! New job and opportunity alerts will land in your inbox.",
        );
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
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <div className="flex max-w-xl flex-col gap-2 sm:flex-row">
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
              className="w-full flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40"
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
                  key={o.tag}
                  label={o.label}
                  selected={types.includes(o.tag)}
                  onToggle={() => toggle(types, setTypes, o.tag)}
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
