"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { POST_TYPES, POST_TYPE_LABELS } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40";

const labelClass =
  "block text-sm font-medium text-slate-700 dark:text-slate-300";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Volunteer", "Internship", "Remote"];
const EXPERIENCE_LEVELS = ["Entry", "Graduate", "Mid", "Senior", "Not specified"];

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export default function NewPostPage() {
  const supabase = createBrowserClient();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<{ name: string; preview: string } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ type: "job" });
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file (JPG, PNG, WebP…).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Photo must be 4 MB or smaller.");
      return;
    }
    setPhoto({ name: file.name, preview: URL.createObjectURL(file) });
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
    });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title?.trim() || !form.organization?.trim() || !form.description?.trim()) {
      setError("Title, organisation and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      const file = fileRef.current?.files?.[0];
      if (file && photo) {
        imageUrl = await uploadPhoto(file);
      }
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image_url: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong submitting the listing.");
      setDone(true);
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-600 text-white">
            <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-emerald-900 dark:text-emerald-300">
            Listing submitted
          </h1>
          <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-400">
            Thanks! Your listing has been received. It will be reviewed and, if approved,
            published on the board shortly.
          </p>
          <Link
            href="/posts"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/posts"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
      >
        ← All listings
      </Link>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Post a listing
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Share a job, internship, scholarship, grant or opportunity for healthcare
        professionals in Uganda. Listings are reviewed before going live.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="title">
              Title *
            </label>
            <input
              id="title"
              required
              value={form.title ?? ""}
              onChange={set("title")}
              placeholder="e.g. Registered Nurse — Mulago Hospital"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="type">
              Type *
            </label>
            <select id="type" value={form.type} onChange={set("type")} className={`mt-1.5 ${inputClass}`}>
              {POST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {POST_TYPE_LABELS[t].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="organization">
              Organisation *
            </label>
            <input
              id="organization"
              required
              value={form.organization ?? ""}
              onChange={set("organization")}
              placeholder="e.g. Ministry of Health"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="profession">
              Profession / cadre
            </label>
            <input
              id="profession"
              value={form.profession ?? ""}
              onChange={set("profession")}
              placeholder="e.g. Nurse / Midwife"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="location">
              Location
            </label>
            <input
              id="location"
              value={form.location ?? ""}
              onChange={set("location")}
              placeholder="e.g. Kampala, Uganda or Remote"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="employment_type">
              Employment type
            </label>
            <select id="employment_type" value={form.employment_type ?? ""} onChange={set("employment_type")} className={`mt-1.5 ${inputClass}`}>
              <option value="">Not specified</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="experience_level">
              Experience level
            </label>
            <select id="experience_level" value={form.experience_level ?? ""} onChange={set("experience_level")} className={`mt-1.5 ${inputClass}`}>
              <option value="">Not specified</option>
              {EXPERIENCE_LEVELS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="salary">
              Salary / pay
            </label>
            <input
              id="salary"
              value={form.salary ?? ""}
              onChange={set("salary")}
              placeholder="e.g. 2,000,000 UGX / month"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="deadline">
              Application deadline
            </label>
            <input
              id="deadline"
              type="date"
              value={form.deadline ?? ""}
              onChange={set("deadline")}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="summary">
              Short summary
            </label>
            <input
              id="summary"
              value={form.summary ?? ""}
              onChange={set("summary")}
              placeholder="One line about the role (shown on cards)"
              maxLength={200}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="description">
              Full description *
            </label>
            <textarea
              id="description"
              required
              rows={8}
              value={form.description ?? ""}
              onChange={set("description")}
              placeholder="Role, duties, requirements, benefits, how to apply…"
              className={`mt-1.5 ${inputClass} resize-y`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="how_to_apply">
              How to apply
            </label>
            <textarea
              id="how_to_apply"
              rows={3}
              value={form.how_to_apply ?? ""}
              onChange={set("how_to_apply")}
              placeholder="Any specific instructions beyond the link/email below"
              className={`mt-1.5 ${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="application_url">
              Application link
            </label>
            <input
              id="application_url"
              type="url"
              value={form.application_url ?? ""}
              onChange={set("application_url")}
              placeholder="https://…"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="application_email">
              Application email
            </label>
            <input
              id="application_email"
              type="email"
              value={form.application_email ?? ""}
              onChange={set("application_email")}
              placeholder="jobs@example.org"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="photo">
              Photo (optional)
            </label>
            <input
              id="photo"
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              className="mt-1.5 block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-600 file:mr-3 file:rounded-l-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-2.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:file:bg-emerald-900/40 dark:file:text-emerald-300"
            />
            {photo ? (
              <div className="mt-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.preview}
                  alt="Preview"
                  className="h-20 w-20 rounded-xl object-cover"
                />
                <span className="truncate text-sm text-slate-500 dark:text-slate-400">{photo.name}</span>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                JPG, PNG or WebP up to 4 MB.
              </p>
            )}
            {imageError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{imageError}</p>}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit for review"}
        </button>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Listings are reviewed before going live. Please only post genuine opportunities.
        </p>
      </form>
    </div>
  );
}
