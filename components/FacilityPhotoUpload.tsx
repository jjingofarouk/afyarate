"use client";

import { useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export default function FacilityPhotoUpload({ slug }: { slug: string }) {
  const supabase = createBrowserClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);

    if (!file.type.startsWith("image/")) {
      setMessage({ kind: "err", text: "Please choose an image file." });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage({ kind: "err", text: "Image must be under 4MB." });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `facility-uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("post-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data } = supabase.storage.from("post-images").getPublicUrl(path);

      const res = await fetch(`/api/facilities/${slug}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: data.publicUrl, storagePath: path, name: name.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not submit photo.");

      setMessage({ kind: "ok", text: "Thanks! Your photo is queued for review before it appears publicly." });
    } catch (err) {
      setMessage({ kind: "err", text: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Add a photo</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Share a real photo of this facility. Every submission is reviewed by our team before it
        goes live, so it may take a little time to appear.
      </p>

      <div className="mt-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Your name (optional)"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900/40"
        />
      </div>

      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
        {uploading ? "Uploading…" : "Choose a photo"}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>

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
    </div>
  );
}
