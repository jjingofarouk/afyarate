/** Client-side helper for admin API calls. The admin session travels in an
 *  httpOnly cookie, so same-origin fetch carries it automatically. A 401
 *  (expired/invalid session) bounces the user to the login page. */
export async function adminFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/admin/login";
    throw new Error("Your admin session has expired. Please sign in again.");
  }
  return res;
}

export async function adminJson<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await adminFetch(path, init);
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error ?? "Something went wrong.");
  }
  return data;
}
