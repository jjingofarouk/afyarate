import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  return clearAdminSession(res);
}
