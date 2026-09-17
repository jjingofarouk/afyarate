import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectiveId, getAuthUserId } from "@/lib/auth-server";
import { clientIp, limited, str, UUID_RE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Account management (mirrors legacy account-management.php +
// account-capabilities.php): password change, primary type, additive
// capabilities, deactivate, permanent delete.
const CAPABILITIES = ["job_seeking", "organization", "healthcare_professional"] as const;
type Capability = (typeof CAPABILITIES)[number];

function admin() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/** Verify the caller's current password against Supabase Auth. */
async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!url || !key) return false;
  const supabase = admin();
  if (!supabase) return false;
  const { data } = await supabase.auth.admin.getUserById(userId);
  const email = data.user?.email;
  if (!email) return false;
  const anon = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await anon.auth.signInWithPassword({ email, password });
  return !error;
}

// Everything the /account page renders in one round trip.
export async function GET(req: NextRequest) {
  const authId = await getAuthUserId(req);
  const profileId = effectiveId(authId, req.nextUrl.searchParams.get("profileId") ?? "");
  if (!UUID_RE.test(profileId)) {
    return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
  }
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const [profileRes, capsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, handle, display_name, email, role, cadre, location, bio, organization, status, account_status")
      .eq("id", profileId)
      .maybeSingle(),
    supabase.from("profile_capabilities").select("capability, active").eq("profile_id", profileId),
  ]);
  if (!profileRes.data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  const caps = new Map(
    ((capsRes.data ?? []) as { capability: string; active: boolean }[]).map((c) => [
      c.capability,
      c.active,
    ]),
  );
  // The primary role always implies its capability, active or not.
  const role = String((profileRes.data as { role: string }).role);
  if (role === "jobseeker") caps.set("job_seeking", true);
  if (role === "employer") caps.set("organization", true);

  return NextResponse.json({
    profile: profileRes.data,
    canManage: !!authId,
    capabilities: CAPABILITIES.map((c) => ({ capability: c, active: caps.get(c) === true })),
  });
}

export async function POST(req: NextRequest) {
  const authId = await getAuthUserId(req);
  if (!authId) {
    // Password/security actions require a verified login, not a bare handle.
    return NextResponse.json(
      { error: "Log in to manage your account security." },
      { status: 401 },
    );
  }
  if (limited(`account:${clientIp(req)}`, 20)) {
    return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const action = str(b.action, 30);
  const supabase = admin();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  if (action === "password") {
    const current = typeof b.currentPassword === "string" ? b.currentPassword : "";
    const next = typeof b.newPassword === "string" ? b.newPassword : "";
    if (next.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    if (!(await verifyPassword(authId, current))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
    }
    const { error } = await supabase.auth.admin.updateUserById(authId, { password: next });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Password changed." });
  }

  if (action === "role") {
    const role = str(b.role, 20);
    if (!["member", "jobseeker", "employer"].includes(role)) {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
    }
    // Keep any capability the previous primary type implied (legacy behaviour:
    // a former Job Seeker/Employer role is preserved as an additional capability).
    const { data: current } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authId)
      .maybeSingle();
    const previous = String((current as { role?: string } | null)?.role ?? "");
    const implied: Capability | null =
      previous === "jobseeker" ? "job_seeking" : previous === "employer" ? "organization" : null;
    if (implied && previous !== role) {
      await supabase
        .from("profile_capabilities")
        .upsert({ profile_id: authId, capability: implied, active: true }, { onConflict: "profile_id,capability" });
    }
    const { error } = await supabase.from("profiles").update({ role }).eq("id", authId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Account type updated." });
  }

  if (action === "capability") {
    const capability = str(b.capability, 40) as Capability;
    const active = b.active === true;
    if (!CAPABILITIES.includes(capability)) {
      return NextResponse.json({ error: "Unknown capability" }, { status: 400 });
    }
    const { data: current } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authId)
      .maybeSingle();
    const role = String((current as { role?: string } | null)?.role ?? "");
    if (active === false && capability === "job_seeking" && role === "jobseeker") {
      return NextResponse.json(
        { error: "Job Seeking is your primary account type and cannot be deactivated here." },
        { status: 400 },
      );
    }
    if (active === false && capability === "organization" && role === "employer") {
      return NextResponse.json(
        { error: "Employer is your primary account type and cannot be deactivated here." },
        { status: 400 },
      );
    }
    // Activating employer tools needs an organization to attach listings to.
    if (active && capability === "organization") {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_profile_id", authId)
        .maybeSingle();
      if (!org) {
        const name = str(b.organizationName, 160);
        if (!name) {
          return NextResponse.json(
            { error: "Enter your organization name to activate employer tools." },
            { status: 400 },
          );
        }
        const slug =
          name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) ||
          `org-${Math.random().toString(36).slice(2, 7)}`;
        const { error: orgErr } = await supabase
          .from("organizations")
          .upsert(
            { slug, name, owner_profile_id: authId, verified: false },
            { onConflict: "slug", ignoreDuplicates: true },
          );
        if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 });
      }
    }
    const { error } = await supabase
      .from("profile_capabilities")
      .upsert({ profile_id: authId, capability, active }, { onConflict: "profile_id,capability" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: active ? "Capability activated." : "Capability deactivated." });
  }

  if (action === "deactivate") {
    const password = typeof b.password === "string" ? b.password : "";
    if (!(await verifyPassword(authId, password))) {
      return NextResponse.json({ error: "Password is incorrect." }, { status: 403 });
    }
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: "deactivated" })
      .eq("id", authId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      ok: true,
      message: "Account deactivated. Your data is preserved — log in to reactivate.",
    });
  }

  if (action === "reactivate") {
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: "active" })
      .eq("id", authId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Welcome back — your account is active." });
  }

  if (action === "delete") {
    const password = typeof b.password === "string" ? b.password : "";
    const word = str(b.confirmWord, 10).toUpperCase();
    if (word !== "DELETE") {
      return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
    }
    if (!(await verifyPassword(authId, password))) {
      return NextResponse.json({ error: "Password is incorrect." }, { status: 403 });
    }
    // Anonymise rather than hard-delete: registry rows, applications and post
    // authorship survive (legacy rule: authoritative records are never deleted).
    const { error: anonErr } = await supabase
      .from("profiles")
      .update({
        account_status: "deleted",
        display_name: "Closed account",
        email: null,
        phone: null,
        bio: null,
        skills: null,
        organization: null,
      })
      .eq("id", authId);
    if (anonErr) return NextResponse.json({ error: anonErr.message }, { status: 500 });
    await supabase.from("seeker_profiles").update({ active: false }).eq("profile_id", authId);
    await supabase.auth.admin.deleteUser(authId).catch(() => {});
    return NextResponse.json({ ok: true, message: "Account closed. Your records were anonymised." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
