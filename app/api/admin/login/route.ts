import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { applyAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const passcode = (body as Record<string, unknown>).passcode;
  if (typeof passcode !== "string" || !passcode.trim()) {
    return NextResponse.json({ error: "Enter the admin passcode." }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSCODE ?? "";
  if (!expected) {
    return NextResponse.json(
      { error: "Admin access is not configured on this server yet." },
      { status: 500 },
    );
  }

  const a = Buffer.from(passcode);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  return applyAdminSession(res);
}
