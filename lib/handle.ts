"use client";

// One-click identity: the profile id (uuid) lives in localStorage. No
// passwords — this mirrors the app's anon + rate-limit idiom and replaces the
// legacy PHP login/register until Supabase Auth lands.

const KEY = "musawo_profile_id";
const NAME_KEY = "musawo_display_name";

export function getProfileId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setProfile(id: string, displayName: string): void {
  try {
    localStorage.setItem(KEY, id);
    localStorage.setItem(NAME_KEY, displayName);
  } catch {
    // Private mode: identity just won't persist.
  }
}

export function getDisplayName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(NAME_KEY);
  } catch {
    // Ignore.
  }
}

/** Create a profile handle via the API and persist it locally. */
export async function ensureProfile(displayName: string): Promise<string> {
  const existing = getProfileId();
  if (existing) return existing;
  const handle =
    displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "member";
  const res = await fetch("/api/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: `${handle}-${Math.random().toString(36).slice(2, 7)}`,
      displayName: displayName.trim().slice(0, 120),
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Could not create your profile");
  }
  const data = (await res.json()) as { profile: { id: string; display_name: string } };
  setProfile(data.profile.id, data.profile.display_name);
  return data.profile.id;
}
