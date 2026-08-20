"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const VEHICLE_OPTIONS = ["Basic life support", "Advanced life support", "Motorbike ambulance", "Patient transport van"];

export default function AmbulanceRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [coverageArea, setCoverageArea] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [done, setDone] = useState(false);

  function toggleVehicle(v: string) {
    setVehicleTypes((list) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]));
  }

  function addService() {
    const v = serviceInput.trim();
    if (!v || services.includes(v)) return;
    setServices((s) => [...s, v]);
    setServiceInput("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setMessage({ kind: "err", text: "Business name and phone number are required." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ambulances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          altPhone: altPhone.trim(),
          email: email.trim(),
          city: city.trim(),
          coverageArea: coverageArea.trim(),
          vehicleTypes,
          services,
          description: description.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error ?? "Could not submit registration." });
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setMessage({ kind: "err", text: "Network error, please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900/40";
  const labelClass = "mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400";

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
        <svg className="mx-auto size-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-50">
          Registration submitted
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Our team reviews every ambulance listing before it goes live, to keep this section
          accurate and trustworthy. We&apos;ll publish it once verified.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <label className={labelClass}>Business / service name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Phone number *</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+256…" className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Alternate phone</label>
          <input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>City / base location</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Coverage area</label>
          <input
            value={coverageArea}
            onChange={(e) => setCoverageArea(e.target.value)}
            placeholder="e.g. Kampala and Wakiso"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Vehicle types</label>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => toggleVehicle(v)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                vehicleTypes.includes(v)
                  ? "border-emerald-500 bg-emerald-50 font-medium text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-slate-300 bg-white text-slate-700 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Additional services</label>
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
            placeholder="e.g. Oxygen support, 24/7 dispatch"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addService}
            className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"
          >
            Add
          </button>
        </div>
        {services.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {services.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {s}
                <button
                  type="button"
                  onClick={() => setServices((list) => list.filter((x) => x !== s))}
                  aria-label={`Remove ${s}`}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={1500}
          placeholder="Response times, fleet size, anything patients should know."
          className={`resize-y ${inputClass}`}
        />
      </div>

      {message && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {message.text}
        </p>
      )}

      <p className="flex items-start gap-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        <svg className="mt-0.5 size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Every listing is reviewed by our team before publishing, to keep this section verified and
        trustworthy for people searching for emergency transport.
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
