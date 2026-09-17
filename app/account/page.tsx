"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import HandleGate, { useHandle } from "@/components/HandleGate";
import { useAuth } from "@/lib/auth-context";

interface Capability {
  capability: "job_seeking" | "organization" | "healthcare_professional";
  active: boolean;
}

interface AccountProfile {
  id: string;
  handle: string;
  display_name: string;
  email: string | null;
  role: string;
  account_status: string;
  organization: string | null;
}

interface Credential {
  id: number;
  credential_type: string;
  credential_name: string;
  issuing_body: string | null;
  credential_number: string | null;
  issued_year: number | null;
  status: string;
  review_note: string | null;
  created_at: string;
}

const CAPABILITY_COPY: Record<Capability["capability"], { title: string; blurb: string }> = {
  job_seeking: {
    title: "Job Seeking",
    blurb: "Save listings, set alerts, publish an open-to-work profile and apply on-platform.",
  },
  organization: {
    title: "Employer / Organization",
    blurb: "Post opportunities, review applicants and manage your organization profile.",
  },
  healthcare_professional: {
    title: "Healthcare Professional",
    blurb: "Connect your registry profile, respond to ratings and manage patient-facing details.",
  },
};

const ROLE_LABEL: Record<string, string> = {
  member: "General Public",
  jobseeker: "Job Seeker",
  employer: "Employer / Organization",
  admin: "Administrator",
};

const input =
  "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800";
const card =
  "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";

function AccountSettings() {
  const { profileId } = useHandle();
  const { user, loading: authLoading, authFetch } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [creds, setCreds] = useState<Credential[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // forms
  const [role, setRole] = useState("member");
  const [orgName, setOrgName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [actionPassword, setActionPassword] = useState("");
  const [deleteWord, setDeleteWord] = useState("");
  const [credType, setCredType] = useState("License");
  const [credName, setCredName] = useState("");
  const [credIssuer, setCredIssuer] = useState("");
  const [credNumber, setCredNumber] = useState("");
  const [credYear, setCredYear] = useState("");

  const load = useCallback(async () => {
    if (!profileId) return;
    const [aRes, cRes] = await Promise.all([
      authFetch(`/api/account?profileId=${profileId}`),
      authFetch(`/api/credentials?profileId=${profileId}`),
    ]);
    if (aRes.ok) {
      const data = (await aRes.json()) as { profile: AccountProfile; capabilities: Capability[] };
      setProfile(data.profile);
      setRole(data.profile.role);
      setOrgName(data.profile.organization ?? "");
      setCapabilities(data.capabilities);
    }
    if (cRes.ok) {
      const data = (await cRes.json()) as { items: Credential[]; types: string[] };
      setCreds(data.items);
      setTypes(data.types);
      if (data.types.length > 0) setCredType((t) => (data.types.includes(t) ? t : data.types[0]));
    }
  }, [profileId, authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (payload: Record<string, unknown>): Promise<boolean> => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await authFetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return false;
      }
      setNotice(data.message ?? "Saved.");
      void load();
      return true;
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (!user) {
    return (
      <div className={card}>
        <h2 className="font-semibold">Log in to manage your account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Password changes, account type and permanent deletion need a verified login.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Log in
        </Link>
      </div>
    );
  }

  const deactivated = profile?.account_status === "deactivated";

  return (
    <div className="space-y-5">
      {notice && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      {deactivated && (
        <div className={card}>
          <h2 className="font-semibold">Account deactivated</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your data is preserved. Reactivate to appear in the community again.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void post({ action: "reactivate" })}
            className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Reactivate account
          </button>
        </div>
      )}

      {/* Identity */}
      <section className={card}>
        <h2 className="font-semibold">Account</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium">{profile?.display_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Handle</dt>
            <dd className="font-medium">
              {profile?.handle ? (
                <Link href={`/members/${profile.handle}`} className="text-emerald-700 underline">
                  @{profile.handle}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium">{profile?.email ?? user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Primary type</dt>
            <dd className="font-medium">{ROLE_LABEL[profile?.role ?? ""] ?? profile?.role}</dd>
          </div>
        </dl>
      </section>

      {/* Primary account type */}
      <section className={card}>
        <h2 className="font-semibold">Primary account type</h2>
        <p className="mt-1 text-sm text-slate-500">
          Changing this keeps your previous type as an additional capability.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select value={role} onChange={(e) => setRole(e.target.value)} className={`${input} sm:w-64`}>
            <option value="member">General Public</option>
            <option value="jobseeker">Job Seeker</option>
            <option value="employer">Employer / Organization</option>
          </select>
          <button
            type="button"
            disabled={busy || role === profile?.role}
            onClick={() => void post({ action: "role", role })}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            Change account type
          </button>
        </div>
      </section>

      {/* Capabilities */}
      <section className={card}>
        <h2 className="font-semibold">Capabilities</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add tools without changing your primary account type.
        </p>
        <ul className="mt-3 space-y-3">
          {capabilities.map((c) => {
            const copy = CAPABILITY_COPY[c.capability];
            return (
              <li key={c.capability} className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{copy.title}</p>
                  <p className="text-xs text-slate-500">{copy.blurb}</p>
                </div>
                {c.active ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void post({ action: "capability", capability: c.capability, active: false })}
                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50 dark:border-slate-700"
                  >
                    Deactivate
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {c.capability === "organization" && (
                      <input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Organization name"
                        maxLength={160}
                        className={`${input} w-44`}
                      />
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void post({
                          action: "capability",
                          capability: c.capability,
                          active: true,
                          organizationName: orgName,
                        })
                      }
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Activate
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Password */}
      <section className={card}>
        <h2 className="font-semibold">Change password</h2>
        <div className="mt-3 grid gap-2 sm:max-w-md">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
            className={input}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (8+ characters)"
            autoComplete="new-password"
            className={input}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            className={input}
          />
          <button
            type="button"
            disabled={busy || !currentPassword || !newPassword}
            onClick={async () => {
              if (newPassword.length < 8) {
                setError("New password must be at least 8 characters.");
                return;
              }
              if (newPassword !== confirmPassword) {
                setError("The new passwords do not match.");
                return;
              }
              const ok = await post({ action: "password", currentPassword, newPassword });
              if (ok) {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Change password
          </button>
        </div>
      </section>

      {/* Credentials */}
      <section className={card}>
        <h2 className="font-semibold">Professional credentials</h2>
        <p className="mt-1 text-sm text-slate-500">
          Submit qualifications, registrations or licences for review. Credential numbers stay
          private and are never shown on your public profile.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select value={credType} onChange={(e) => setCredType(e.target.value)} className={input}>
            {(types.length > 0 ? types : ["License", "Degree", "Diploma", "Certificate"]).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            value={credName}
            onChange={(e) => setCredName(e.target.value)}
            placeholder="Credential name *"
            maxLength={200}
            className={input}
          />
          <input
            value={credIssuer}
            onChange={(e) => setCredIssuer(e.target.value)}
            placeholder="Issuing body"
            maxLength={200}
            className={input}
          />
          <input
            value={credNumber}
            onChange={(e) => setCredNumber(e.target.value)}
            placeholder="Number (private)"
            maxLength={120}
            className={input}
          />
          <input
            value={credYear}
            onChange={(e) => setCredYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="Year issued"
            inputMode="numeric"
            className={input}
          />
          <button
            type="button"
            disabled={busy || !credName.trim() || !profileId}
            onClick={async () => {
              setBusy(true);
              setError("");
              setNotice("");
              try {
                const res = await authFetch("/api/credentials", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    profileId,
                    credentialType: credType,
                    credentialName: credName,
                    issuingBody: credIssuer,
                    credentialNumber: credNumber,
                    issuedYear: credYear,
                  }),
                });
                const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
                if (!res.ok) setError(data.error ?? "Could not submit.");
                else {
                  setNotice(data.message ?? "Submitted.");
                  setCredName("");
                  setCredIssuer("");
                  setCredNumber("");
                  setCredYear("");
                  void load();
                }
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Submit for review
          </button>
        </div>
        {creds.length > 0 && (
          <ul className="mt-4 space-y-2">
            {creds.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {c.credential_name}{" "}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                        c.status === "verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {[c.credential_type, c.issuing_body, c.issued_year].filter(Boolean).join(" · ")}
                    {c.review_note ? ` · ${c.review_note}` : ""}
                  </p>
                </div>
                {c.status !== "verified" && (
                  <button
                    type="button"
                    disabled={busy || !profileId}
                    onClick={async () => {
                      const res = await authFetch(
                        `/api/credentials?profileId=${profileId}&id=${c.id}`,
                        { method: "DELETE" },
                      );
                      if (res.ok) void load();
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-red-600"
                  >
                    Withdraw
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-900/50 dark:bg-red-950/20">        <h2 className="font-semibold text-red-800 dark:text-red-300">Deactivate or delete</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Deactivating is temporary and reversible. Deleting is permanent: your profile is
          anonymised, though registry records and your past applications are kept.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Deactivate</p>
            <input
              type="password"
              value={actionPassword}
              onChange={(e) => setActionPassword(e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
              className={input}
            />
            <button
              type="button"
              disabled={busy || !actionPassword}
              onClick={() => void post({ action: "deactivate", password: actionPassword })}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              Deactivate my account
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Permanently delete</p>
            <input
              value={deleteWord}
              onChange={(e) => setDeleteWord(e.target.value)}
              placeholder="Type DELETE"
              className={input}
            />
            <button
              type="button"
              disabled={busy || deleteWord.trim().toUpperCase() !== "DELETE" || !actionPassword}
              onClick={() => void post({ action: "delete", password: actionPassword, confirmWord: deleteWord })}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Permanently delete my account
            </button>
            {!actionPassword && (
              <p className="text-xs text-slate-500">Enter your password above first.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">My account</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Manage your password, primary account type, capabilities, credentials and account status.
      </p>
      <div className="mt-6">
        <HandleGate prompt="Pick a display name to manage your account">
          <AccountSettings />
        </HandleGate>
      </div>
    </div>
  );
}
