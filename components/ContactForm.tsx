"use client";

import { useState } from "react";

const ACCESS_KEY = "db3f8a28-1e81-46c0-b206-a3b6732b124a";
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-lg outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

const TOPICS = [
  { value: "general", label: "General inquiry", subject: "General inquiry" },
  { value: "partner", label: "I want to become a partner", subject: "Partnership inquiry" },
  { value: "facility", label: "List or update my hospital/pharmacy", subject: "Facility listing request" },
  { value: "ambulance", label: "Register an ambulance service", subject: "Ambulance service registration" },
  { value: "listing_issue", label: "Report an issue with a listing", subject: "Listing issue report" },
  { value: "job_seeker", label: "I'm looking for a job", subject: "Job seeker inquiry" },
  { value: "press", label: "Press / media", subject: "Press inquiry" },
  { value: "other", label: "Other", subject: "" },
] as const;

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]["value"]>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [subjectTouched, setSubjectTouched] = useState(false);

  const showOrganization = topic === "partner" || topic === "facility" || topic === "ambulance" || topic === "press";

  function onTopicChange(value: (typeof TOPICS)[number]["value"]) {
    setTopic(value);
    // Auto-fill the subject from the topic, but only if the user hasn't
    // typed their own subject yet, don't clobber something they wrote.
    if (!subjectTouched) {
      const preset = TOPICS.find((t) => t.value === value)?.subject ?? "";
      setSubject(preset);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          name,
          email,
          phone: phone || undefined,
          organization: organization || undefined,
          topic: TOPICS.find((t) => t.value === topic)?.label ?? topic,
          from_name: "Rate Musawo",
          subject: subject || "Message from Rate Musawo",
          message,
          botcheck: "", // honeypot, must stay empty
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message ?? "Something went wrong.");
      setDone(true);
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-600 text-white">
          <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-emerald-900 dark:text-emerald-300">
          Message sent
        </h2>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-400">
          Thanks for reaching out. We&apos;ll get back to you as soon as we can.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="topic">
            What&apos;s this about?
          </label>
          <select
            id="topic"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value as (typeof TOPICS)[number]["value"])}
            className={`mt-1.5 ${inputClass}`}
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="phone">
            Phone <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+256…"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>
        {showOrganization && (
          <div>
            <label className={labelClass} htmlFor="organization">
              {topic === "facility" ? "Facility name" : "Organization"}{" "}
              <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
            </label>
            <input
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder={topic === "facility" ? "e.g. Mulago Hospital" : "Your organization"}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="subject">
            Subject
          </label>
          <input
            id="subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setSubjectTouched(true);
            }}
            placeholder="How can we help?"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message…"
            className={`mt-1.5 ${inputClass} resize-y`}
          />
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
