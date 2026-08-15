"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { adminJson } from "@/lib/admin-client";
import { POST_TYPES, POST_TYPE_LABELS, type Post } from "@/lib/types";
import StatusBadge from "./StatusBadge";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/40";

const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Volunteer", "Internship", "Remote"];
const EXPERIENCE_LEVELS = ["Entry", "Graduate", "Mid", "Senior", "Not specified"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function extractPath(url: string): string | null {
  const marker = "/post-images/";
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length).split("?")[0];
}

export default function PostForm({ post }: { post?: Post }) {
  const isEdit = Boolean(post);
  const router = useRouter();
  const supabase = createBrowserClient();

  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = { type: "job", country: "Uganda" };
    if (post) {
      init.type = post.type;
      init.title = post.title;
      init.organization = post.organization;
      init.category = post.category ?? "";
      init.profession = post.profession ?? "";
      init.location = post.location ?? "";
      init.country = post.country ?? "Uganda";
      init.employment_type = post.employmentType ?? "";
      init.experience_level = post.experienceLevel ?? "";
      init.qualification = post.qualification ?? "";
      init.eligibility = post.eligibility ?? "";
      init.salary = post.salary ?? "";
      init.description = post.description;
      init.summary = post.summary ?? "";
      init.how_to_apply = post.howToApply ?? "";
      init.application_url = post.applicationUrl ?? "";
      init.application_email = post.applicationEmail ?? "";
      init.deadline = post.deadline ?? "";
      init.source_name = post.sourceName ?? "";
      init.source_url = post.sourceUrl ?? "";
      init.submitter_name = post.submitterName ?? "";
      init.submitter_email = post.submitterEmail ?? "";
    }
    return init;
  });

  const [tags, setTags] = useState<string>(post?.tags?.join(", ") ?? "");
  const [featured, setFeatured] = useState<boolean>(post?.featured ?? false);
  const [status, setStatus] = useState<string>(post?.status ?? "draft");

  const [newImage, setNewImage] = useState<{ name: string; preview: string } | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const existingImage = post?.imageUrl ?? null;
  const showImage = !removeImage ? newImage?.preview ?? existingImage : null;

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
    setRemoveImage(false);
    setNewImage({ name: file.name, preview: URL.createObjectURL(file) });
  }

  async function uploadPhoto(file: File): Promise<string> {
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

  function buildBody(extra: Record<string, unknown>): Record<string, unknown> {
    const body: Record<string, unknown> = {
      ...form,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      featured,
      ...extra,
    };
    return body;
  }

  async function submit(extra: Record<string, unknown>) {
    setError(null);
    setBusy("save");
    try {
      const file = fileRef.current?.files?.[0];
      const body = buildBody(extra);

      if (file && newImage) {
        body.image_url = await uploadPhoto(file);
        // Replacing an existing photo → also remove the old storage object.
        if (isEdit && existingImage && !removeImage) {
          const oldPath = extractPath(existingImage);
          if (oldPath) body.delete_image_path = oldPath;
        }
      } else if (removeImage) {
        body.image_url = null;
        if (isEdit && existingImage) {
          const oldPath = extractPath(existingImage);
          if (oldPath) body.delete_image_path = oldPath;
        }
      }

      const res = await adminJson(
        isEdit ? `/api/admin/posts/${post!.id}` : "/api/admin/posts",
        { method: isEdit ? "PATCH" : "POST", body: JSON.stringify(body) },
      );

      if (isEdit) {
        router.push("/admin/posts");
        router.refresh();
      } else {
        router.push("/admin/posts");
        router.refresh();
      }
      void res;
    } catch (err) {
      setError((err as Error).message || "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit({ status });
      }}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
    >
      {isEdit && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <StatusBadge status={post!.status} />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              ID {post!.id} · slug: {post!.slug}
            </span>
          </div>
          {post!.status === "published" && (
            <Link
              href={`/posts/${post!.slug}`}
              target="_blank"
              className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              View public page ↗
            </Link>
          )}
        </div>
      )}

      {isEdit && post!.status === "rejected" && post!.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <span className="font-semibold">Rejected:</span> {post!.rejectionReason}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="title">
            Title *
          </label>
          <input id="title" required value={form.title ?? ""} onChange={set("title")} placeholder="e.g. Registered Nurse — Mulago Hospital" className={`mt-1.5 ${inputClass}`} />
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
          <input id="organization" required value={form.organization ?? ""} onChange={set("organization")} placeholder="e.g. Ministry of Health" className={`mt-1.5 ${inputClass}`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="category">
            Category
          </label>
          <input id="category" value={form.category ?? ""} onChange={set("category")} placeholder="e.g. Health, Education" className={`mt-1.5 ${inputClass}`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="profession">
            Profession / cadre
          </label>
          <input id="profession" value={form.profession ?? ""} onChange={set("profession")} placeholder="e.g. Nurse / Midwife" className={`mt-1.5 ${inputClass}`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="location">
            Location
          </label>
          <input id="location" value={form.location ?? ""} onChange={set("location")} placeholder="e.g. Kampala, Uganda or Remote" className={`mt-1.5 ${inputClass}`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="country">
            Country
          </label>
          <input id="country" value={form.country ?? "Uganda"} onChange={set("country")} className={`mt-1.5 ${inputClass}`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="employment_type">
            Employment type
          </label>
          <select id="employment_type" value={form.employment_type ?? ""} onChange={set("employment_type")} className={`mt-1.5 ${inputClass}`}>
            <option value="">Not specified</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
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
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="salary">
            Salary / pay
          </label>
          <input id="salary" value={form.salary ?? ""} onChange={set("salary")} placeholder="e.g. 2,000,000 UGX / month" className={`mt-1.5 ${inputClass}`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="deadline">
            Application deadline
          </label>
          <input id="deadline" type="date" value={form.deadline ?? ""} onChange={set("deadline")} className={`mt-1.5 ${inputClass}`} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="summary">
            Short summary
          </label>
          <input id="summary" maxLength={200} value={form.summary ?? ""} onChange={set("summary")} placeholder="One line about the role (shown on cards)" className={`mt-1.5 ${inputClass}`} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="description">
            Full description *
          </label>
          <textarea id="description" required rows={8} value={form.description ?? ""} onChange={set("description")} placeholder="Role, duties, requirements, benefits, how to apply…" className={`mt-1.5 ${inputClass} resize-y`} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="how_to_apply">
            How to apply
          </label>
          <textarea id="how_to_apply" rows={3} value={form.how_to_apply ?? ""} onChange={set("how_to_apply")} className={`mt-1.5 ${inputClass} resize-y`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="application_url">
            Application link
          </label>
          <input id="application_url" type="url" value={form.application_url ?? ""} onChange={set("application_url")} placeholder="https://…" className={`mt-1.5 ${inputClass}`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="application_email">
            Application email
          </label>
          <input id="application_email" type="email" value={form.application_email ?? ""} onChange={set("application_email")} placeholder="jobs@example.org" className={`mt-1.5 ${inputClass}`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="qualification">
            Qualification / credentials
          </label>
          <textarea id="qualification" rows={2} value={form.qualification ?? ""} onChange={set("qualification")} className={`mt-1.5 ${inputClass} resize-y`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="eligibility">
            Eligibility
          </label>
          <textarea id="eligibility" rows={2} value={form.eligibility ?? ""} onChange={set("eligibility")} placeholder="Who may apply (esp. grants/scholarships)" className={`mt-1.5 ${inputClass} resize-y`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="source_name">
            Source / organisation name
          </label>
          <input id="source_name" value={form.source_name ?? ""} onChange={set("source_name")} placeholder="e.g. Ministry of Health, WHO Uganda" className={`mt-1.5 ${inputClass}`} />
        </div>

        <div>
          <label className={labelClass} htmlFor="source_url">
            Source URL
          </label>
          <input id="source_url" type="url" value={form.source_url ?? ""} onChange={set("source_url")} placeholder="https://…" className={`mt-1.5 ${inputClass}`} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="tags">
            Tags
          </label>
          <input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma separated, e.g. nursing, kampala, fresh-graduate" className={`mt-1.5 ${inputClass}`} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="photo">
            Photo (optional)
          </label>
          <input id="photo" ref={fileRef} type="file" accept="image/*" onChange={onFile} className="mt-1.5 block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-600 file:mr-3 file:rounded-l-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-2.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:file:bg-emerald-900/40 dark:file:text-emerald-300" />
          {showImage ? (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={showImage} alt="Preview" className="h-20 w-20 rounded-xl object-cover object-top" />
              <button
                type="button"
                onClick={() => {
                  setRemoveImage(true);
                  setNewImage(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
              >
                Remove photo
              </button>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
              {removeImage ? "Photo removed — save to confirm." : "JPG, PNG or WebP up to 4 MB."}
            </p>
          )}
          {imageError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{imageError}</p>}
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <input
            id="featured"
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="size-4 accent-emerald-600"
          />
          <label htmlFor="featured" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Feature on the board (pinned to the top)
          </label>
        </div>

        {isEdit && (post!.submitterName || post!.submitterEmail) && (
          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Submitted by (ordinary user)</p>
            <p className="mt-1.5 text-slate-700 dark:text-slate-300">
              {post!.submitterName || "Anonymous"}
              {post!.submitterEmail ? ` · ${post!.submitterEmail}` : ""}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
        {isEdit ? (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void submit({ status: "draft" })}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Save as draft
            </button>
            <button
              type="submit"
              disabled={busy !== null}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
            {post!.status !== "published" && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void submit({ action: "publish" })}
                className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {busy ? "Publishing…" : "Save & publish"}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="submit"
              disabled={busy !== null}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Create listing"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void submit({ status: "published" })}
              className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
            >
              Create & publish
            </button>
          </>
        )}
      </div>
    </form>
  );
}
