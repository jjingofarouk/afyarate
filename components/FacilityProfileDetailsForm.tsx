"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function FacilityProfileDetailsForm({
  facilityId,
  token,
  name,
}: {
  facilityId: number;
  token: string;
  name: string;
}) {
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/facility-profile-details/${facilityId}?t=${encodeURIComponent(token)}`
        );
        if (!res.ok) throw new Error("This edit link is not valid.");
        const data = await res.json();
        const d = data.details ?? {};
        setPhone(d.phone ?? "");
        setWhatsapp(d.whatsapp ?? "");
        setDescription(d.description ?? "");
        setServices(Array.isArray(d.services) ? d.services.join(", ") : "");
        setPhotoUrl(d.photo_url ?? "");
        setWebsite(d.website ?? "");
        setFacebook(d.facebook ?? "");
        setXHandle(d.x_handle ?? "");
        setInstagram(d.instagram ?? "");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [facilityId, token]);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG or PNG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const sb = createBrowserClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `facilities/${facilityId}/${Date.now()}.${ext}`;
      const { error: upErr } = await sb.storage.from("profile-photos").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw new Error(upErr.message);
      const { data } = sb.storage.from("profile-photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/facility-profile-details/${facilityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          phone,
          whatsapp,
          description,
          services,
          photo_url: photoUrl,
          website,
          facebook,
          x_handle: xHandle,
          instagram,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading your details…</p>;
  if (error && !phone && !description) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Your facility details</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Everything here appears on <span className="font-semibold">{name}</span>&apos;s public page.
      </p>
      <div className="mt-6 space-y-7">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Facility photo</h3>
          <div className="mt-2 flex items-center gap-4">
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Facility photo preview" className="size-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">No photo</span>
              )}
            </div>
            <div>
              <label htmlFor="fd-photo" className="inline-flex cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
              </label>
              <input id="fd-photo" type="file" accept="image/*" onChange={onPhoto} className="hidden" />
              <p className="mt-1.5 text-xs text-slate-400">JPG or PNG, under 5 MB. Shows first in your gallery.</p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="fd-phone" className={labelClass}>Phone (shown to patients)</label>
            <input id="fd-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+256 7xx xxx xxx" className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label htmlFor="fd-wa" className={labelClass}>WhatsApp number</label>
            <input id="fd-wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+256 7xx xxx xxx" className={`mt-1.5 ${inputClass}`} />
          </div>
        </div>
        <div>
          <label htmlFor="fd-desc" className={labelClass}>About your facility</label>
          <textarea id="fd-desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Services, opening hours, location details…" className={`mt-1.5 ${inputClass} resize-y`} />
        </div>
        <div>
          <label htmlFor="fd-serv" className={labelClass}>Services <span className="font-normal text-slate-400">(comma separated)</span></label>
          <input id="fd-serv" value={services} onChange={(e) => setServices(e.target.value)} placeholder="e.g. Maternity, Lab, Pharmacy" className={`mt-1.5 ${inputClass}`} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="fd-web" className={labelClass}>Website (optional)</label>
            <input id="fd-web" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label htmlFor="fd-fb" className={labelClass}>Facebook</label>
            <input id="fd-fb" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/…" className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label htmlFor="fd-x" className={labelClass}>X (Twitter)</label>
            <input id="fd-x" value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="@…" className={`mt-1.5 ${inputClass}`} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="fd-ig" className={labelClass}>Instagram</label>
            <input id="fd-ig" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/…" className={`mt-1.5 ${inputClass}`} />
          </div>
        </div>
      </div>
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-800">
          Saved — your facility page is updated live.
        </div>
      )}
      <button type="submit" disabled={saving} className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save my details"}
      </button>
    </form>
  );
}
