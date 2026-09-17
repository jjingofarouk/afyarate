import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDbReady } from "@/lib/practitioners";
import { effectiveId, getAuthUserId } from "@/lib/auth-server";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function admin() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

// Vault file list for a handle.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const profileId = effectiveId(await getAuthUserId(req), sp.get("profileId") ?? "");
  const id = Number(sp.get("id"));
  const download = sp.get("download") === "1";
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  if (download) {
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const { data: row } = await supabase
      .from("documents")
      .select("id, profile_id, storage_path, label")
      .eq("id", id)
      .maybeSingle();
    const r = row as { profile_id: string; storage_path: string; label: string } | null;
    if (!r || r.profile_id !== profileId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { data, error } = await supabase.storage
      .from("applicant-docs")
      .createSignedUrl(r.storage_path, 120);
    if (error || !data) return NextResponse.json({ error: "Could not sign URL" }, { status: 500 });
    return NextResponse.json({ url: data.signedUrl });
  }

  const { data, error } = await supabase
    .from("documents")
    .select("id, label, kind, mime_type, size_bytes, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// Upload a vault file (multipart: file, profileId, label, kind).
export async function POST(req: NextRequest) {
  if (!(await isDbReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }
  if (limited(`docs:${clientIp(req)}`, 20)) {
    return NextResponse.json({ error: "Too many uploads, try again later" }, { status: 429 });
  }
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  const file = form.get("file");
  const profileId = effectiveId(await getAuthUserId(req), str(form.get("profileId"), 40));
  const label = str(form.get("label"), 120) || (file instanceof File ? file.name : "Document");
  const kind = str(form.get("kind"), 20) || "cv";
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file first" }, { status: 400 });
  }
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Create your handle first" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be 5 MB or less" }, { status: 400 });
  }
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "PDF, Word or image files only" }, { status: 400 });
  }
  if (!["cv", "certificate", "licence", "transcript", "other"].includes(kind)) {
    return NextResponse.json({ error: "Invalid document kind" }, { status: 400 });
  }

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "file";
  const path = `${profileId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from("applicant-docs")
    .upload(path, bytes, { contentType: file.type || "application/octet-stream" });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data, error: insErr } = await supabase
    .from("documents")
    .insert({
      profile_id: profileId,
      label: label.slice(0, 120),
      kind,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select("id, label, kind, mime_type, size_bytes, created_at")
    .single();
  if (insErr) {
    await supabase.storage.from("applicant-docs").remove([path]);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  return NextResponse.json({ document: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const profileId = effectiveId(await getAuthUserId(req), sp.get("profileId") ?? "");
  const id = Number(sp.get("id"));
  if (!UUID_RE.test(profileId) || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data: row } = await supabase
    .from("documents")
    .select("id, profile_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  const r = row as { profile_id: string; storage_path: string } | null;
  if (!r || r.profile_id !== profileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await supabase.storage.from("applicant-docs").remove([r.storage_path]);
  await supabase.from("documents").delete().eq("id", id);
  return NextResponse.json({ deleted: true });
}
