import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";

/** Name of the httpOnly cookie that carries the admin session. */
export const ADMIN_COOKIE = "musawo_admin_session";

const SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_SECONDS = Math.floor(SESSION_MS / 1000);

/**
 * Admin sessions are stateless, signed tokens: `admin.<expiry>.<hmac>`.
 * The HMAC secret is the ADMIN_PASSCODE itself, possession of the passcode is
 * the definition of "is admin", so a signed cookie is as strong as the
 * passcode. No database or external session store needed.
 */
function passcode(): string {
  return process.env.ADMIN_PASSCODE ?? "";
}

function hmac(data: string): string {
  return createHmac("sha256", passcode()).update(data).digest("hex");
}

export function signAdminSession(): string {
  const payload = `admin.${Date.now() + SESSION_MS}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifyAdminSession(token: string | undefined | null): boolean {
  if (!token || !passcode()) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [kind, expStr, sig] = parts;
  if (kind !== "admin") return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = hmac(`${kind}.${expStr}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Read the session cookie from the request context (server components). */
export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminSession(store.get(ADMIN_COOKIE)?.value);
}

/** Read the session cookie from an incoming API request. */
export function isAdminRequest(req: NextRequest): boolean {
  return verifyAdminSession(req.cookies.get(ADMIN_COOKIE)?.value);
}

/** Guard for server components/layouts, redirects to the login page. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthed())) redirect("/admin/login");
}

/** Attach a fresh signed session cookie to a response (login). */
export function applyAdminSession(res: NextResponse): NextResponse {
  res.cookies.set(ADMIN_COOKIE, signAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return res;
}

/** Clear the session cookie (logout). */
export function clearAdminSession(res: NextResponse): NextResponse {
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
