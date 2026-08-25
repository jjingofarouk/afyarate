"use client";

import { useState } from "react";

const ACCESS_KEY = "db3f8a28-1e81-46c0-b206-a3b6732b124a";

const TOPICS = [
  { value: "general", label: "General inquiry", subject: "General inquiry" },
  { value: "claim", label: "Claim my profile · UGX 5,000", subject: "Profile claim request" },
  { value: "partner", label: "Partnership", subject: "Partnership inquiry" },
  { value: "facility", label: "List my hospital/pharmacy", subject: "Facility listing request" },
  { value: "ambulance", label: "Register an ambulance", subject: "Ambulance service registration" },
  { value: "listing_issue", label: "Report an issue", subject: "Listing issue report" },
  { value: "job_seeker", label: "I'm looking for a job", subject: "Job seeker inquiry" },
  { value: "press", label: "Press / media", subject: "Press inquiry" },
  { value: "other", label: "Other", subject: "" },
] as const;

type TopicValue = (typeof TOPICS)[number]["value"];

type FieldDef =
  | { kind: "text"; name: string; label: string; placeholder?: string; required?: boolean; span?: boolean }
  | { kind: "select"; name: string; label: string; options: readonly string[]; placeholder?: string; required?: boolean; span?: boolean };

const CLAIM_STEPS = [
  { title: "Send your details", desc: "Name, licence number and what you want on your profile." },
  { title: "We verify", desc: "We check you against the national registry within 24 hours." },
  { title: "Pay once", desc: "UGX 5,000 by mobile money after we confirm your identity." },
  { title: "Go live", desc: "Patients see your badge, contacts and workplace right away." },
] as const;

const TOPIC_PANELS: Partial<Record<TopicValue, { eyebrow: string; title: string; steps?: readonly { title: string; desc: string }[]; note?: string }>> = {
  claim: {
    eyebrow: "Profile verification",
    title: "Claim your profile in 4 steps",
    steps: CLAIM_STEPS,
    note: "Free until you approve · UGX 5,000 one-time · We'll never share your details",
  },
  facility: {
    eyebrow: "For facilities",
    title: "Get your hospital or pharmacy listed",
    note: "Basic listings are free. Featured placements put you at the top of search results in your area.",
  },
  ambulance: {
    eyebrow: "For ambulance providers",
    title: "Join the national ambulance directory",
    note: "Approved providers appear on our ambulances page with a direct call button.",
  },
  partner: {
    eyebrow: "Partnerships",
    title: "Work with us",
    note: "Tell us what you have in mind — advertising, sponsored listings, data access or something else.",
  },
  listing_issue: {
    eyebrow: "Report an issue",
    title: "Help us keep listings accurate",
    note: "Reports are reviewed within 48 hours. Serious issues are prioritised.",
  },
};

const EXTRA_FIELDS: Partial<Record<TopicValue, FieldDef[]>> = {
  facility: [
    { kind: "select", name: "facility_type", label: "Facility type", required: true, options: ["Hospital", "Health centre", "Clinic", "Pharmacy", "Other"] },
    { kind: "text", name: "location", label: "Location", placeholder: "e.g. Ntinda, Kampala" },
    { kind: "select", name: "plan_interest", label: "I'm interested in", options: ["Free listing", "Featured listing (top of search)", "Not sure yet — tell me more"], placeholder: "Choose one" },
  ],
  ambulance: [
    { kind: "select", name: "service_level", label: "Service level", required: true, options: ["Basic life support", "Advanced life support", "Both", "Not sure"] },
    { kind: "text", name: "coverage_area", label: "Areas covered", placeholder: "e.g. Kampala, Wakiso, Mukono", span: true },
  ],
  partner: [
    { kind: "select", name: "partnership_type", label: "Partnership type", required: true, options: ["Advertising", "Sponsored listings", "Data / API access", "CSR / community project", "Other"] },
    { kind: "text", name: "budget_range", label: "Indicative budget", placeholder: "e.g. UGX 500k (optional)" },
  ],
  listing_issue: [
    { kind: "select", name: "issue_type", label: "What's wrong?", required: true, options: ["Wrong information", "Fake or unfair review", "Duplicate listing", "Someone claimed my profile wrongly", "Expired licence still listed as active", "Other"] },
    { kind: "text", name: "listing_url", label: "Link to the listing", placeholder: "Paste the page URL", required: true, span: true },
  ],
  job_seeker: [
    { kind: "select", name: "profession", label: "Your profession", required: true, options: ["Doctor", "Nurse", "Midwife", "Pharmacist", "Dentist", "Clinical officer", "Laboratory officer", "Allied health", "Student", "Other"] },
    { kind: "select", name: "help_with", label: "What do you need?", options: ["Job alerts by email", "Help finding a job", "Career guidance", "Something else"], placeholder: "Choose one" },
  ],
  press: [
    { kind: "text", name: "outlet", label: "Outlet / publication", placeholder: "e.g. Daily Monitor", required: true },
    { kind: "select", name: "deadline", label: "How urgent?", options: ["Today", "This week", "No rush"], placeholder: "Choose one" },
  ],
};

export default function ContactForm({ initialTopic }: { initialTopic?: TopicValue }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const validInitial: TopicValue =
    initialTopic && TOPICS.some((t) => t.value === initialTopic)
      ? initialTopic
      : "general";
  const [topic, setTopic] = useState<TopicValue>(validInitial);
  const [subject, setSubject] = useState<string>(
    TOPICS.find((t) => t.value === validInitial)?.subject ?? ""
  );
  const [message, setMessage] = useState("");
  const [subjectTouched, setSubjectTouched] = useState(false);
  const [extras, setExtras] = useState<Record<string, string>>({});

  const isClaim = topic === "claim";
  const panel = TOPIC_PANELS[topic];
  const extraFields = EXTRA_FIELDS[topic] ?? [];
  const showOrganization =
    topic === "partner" || topic === "facility" || topic === "ambulance" || topic === "press";
  const accentRing = isClaim || panel?.eyebrow !== undefined
    ? "focus:border-amber-500 focus:ring-amber-100 dark:focus:ring-amber-900/40"
    : "focus:border-emerald-500 focus:ring-emerald-100 dark:focus:ring-emerald-900/40";
  const inputClass = `w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${accentRing}`;
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

  function onTopicChange(value: TopicValue) {
    setTopic(value);
    if (!subjectTouched) {
      setSubject(TOPICS.find((t) => t.value === value)?.subject ?? "");
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
          ...Object.fromEntries(Object.entries(extras).filter(([, v]) => v)),
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
        <div className="check-pop mx-auto grid size-14 place-items-center rounded-full bg-emerald-600 text-white">
          <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path className="draw-check" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-emerald-900 dark:text-emerald-300">
          {isClaim ? "Claim request received" : "Message sent"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800 dark:text-emerald-400">
          {isClaim
            ? "We'll verify your details against the national registry and get back to you within 24 hours with next steps."
            : topic === "facility" || topic === "ambulance"
              ? "Thanks! We'll review your details and get back to you shortly with how to complete your listing."
              : "Thanks for reaching out. We'll get back to you as soon as we can."}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-900 ${
        panel ? "border-amber-200 dark:border-amber-900/50" : "border-slate-200 dark:border-slate-800"
      }`}
    >
      {/* Topic panel header */}
      {panel && (
        <div className={`border-b px-6 pt-6 pb-5 sm:px-8 ${
          panel.steps
            ? "border-amber-100 bg-gradient-to-b from-amber-50 to-white dark:border-amber-900/40 dark:from-amber-950/30 dark:to-slate-900"
            : "border-slate-100 bg-gradient-to-b from-slate-50 to-white dark:border-slate-800 dark:from-slate-950/40 dark:to-slate-900"
        }`}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            {panel.eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {panel.title}
          </h2>
          {panel.steps && (
            <ol className="mt-4 grid gap-3 sm:grid-cols-4">
              {panel.steps.map((s, i) => (
                <li key={s.title} className="rounded-xl border border-amber-200/80 bg-white/80 p-3 dark:border-amber-900/40 dark:bg-slate-900/70">
                  <span className="grid size-6 place-items-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="mt-2 text-xs font-bold text-slate-900 dark:text-slate-100">{s.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{s.desc}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="p-6 sm:p-8">
        {/* Topic chips */}
        <fieldset>
          <legend className={labelClass}>What&apos;s this about?</legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => onTopicChange(t.value)}
                aria-pressed={topic === t.value}
                className={[
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                  topic === t.value
                    ? isClaim
                      ? "border-amber-500 bg-amber-500 text-white shadow-sm shadow-amber-600/30"
                      : "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="name">
              Full name {isClaim && <span className="font-normal text-slate-400 dark:text-slate-500">(as on your licence)</span>}
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isClaim ? "e.g. Dr. Sarah Nakato" : "Your name"}
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
              Phone{" "}
              {isClaim ? (
                <span className="text-amber-600 dark:text-amber-400">(required)</span>
              ) : (
                <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
              )}
            </label>
            <input
              id="phone"
              type="tel"
              required={isClaim}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 7xx xxx xxx"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          {showOrganization && (
            <div>
              <label className={labelClass} htmlFor="organization">
                {topic === "facility" ? "Facility name" : "Organization"}{" "}
                <span className="font-normal text-slate-400 dark:text-slate-500">
                  {topic === "facility" || topic === "ambulance" ? "(required)" : "(optional)"}
                </span>
              </label>
              <input
                id="organization"
                required={topic === "facility" || topic === "ambulance"}
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder={topic === "facility" ? "e.g. Mulago Hospital" : "Your organization"}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
          )}

          {/* Topic-specific fields */}
          {extraFields.map((f) => (
            <div key={f.name} className={f.span ? "sm:col-span-2" : ""}>
              <label className={labelClass} htmlFor={f.name}>
                {f.label}
                {f.required ? (
                  <span className="ml-1 text-red-500">*</span>
                ) : f.kind === "text" ? (
                  <span className="font-normal text-slate-400 dark:text-slate-500"> (optional)</span>
                ) : null}
              </label>
              {f.kind === "select" ? (
                <select
                  id={f.name}
                  required={f.required}
                  value={extras[f.name] ?? ""}
                  onChange={(e) => setExtras((x) => ({ ...x, [f.name]: e.target.value }))}
                  className={`mt-1.5 ${inputClass}`}
                >
                  <option value="" disabled>{f.placeholder ?? "Select…"}</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  id={f.name}
                  required={f.required}
                  value={extras[f.name] ?? ""}
                  onChange={(e) => setExtras((x) => ({ ...x, [f.name]: e.target.value }))}
                  placeholder={f.placeholder}
                  className={`mt-1.5 ${inputClass}`}
                />
              )}
            </div>
          ))}

          {!isClaim && (
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
          )}

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="message">
              {isClaim ? "Your details" : "Message"}
            </label>
            <textarea
              id="message"
              required
              rows={isClaim ? 5 : 6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isClaim
                  ? "Licence / registration number, council (e.g. Uganda Medical and Dental Practitioners Council), where you work, and anything you want on your profile — specialties, bio, contacts…"
                  : topic === "facility"
                    ? "Tell us about your facility: services, number of beds, opening hours, anything patients should know…"
                    : topic === "ambulance"
                      ? "Tell us about your service: vehicles available, response areas, operating hours, contact numbers…"
                      : "Write your message…"
              }
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
          className={[
            "mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
            isClaim
              ? "bg-amber-500 shadow-md shadow-amber-600/25 hover:bg-amber-600 active:bg-amber-700"
              : "bg-emerald-600 hover:bg-emerald-700",
          ].join(" ")}
        >
          {submitting
            ? "Sending…"
            : isClaim
              ? "Request my verified profile"
              : topic === "facility"
                ? "Submit my facility for listing"
                : topic === "ambulance"
                  ? "Register my ambulance service"
                  : topic === "partner"
                    ? "Send partnership inquiry"
                    : "Send message"}
          {!submitting && (
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          )}
        </button>

        {(panel?.note || isClaim) && (
          <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
            {panel?.note}
          </p>
        )}
      </div>
    </form>
  );
}
