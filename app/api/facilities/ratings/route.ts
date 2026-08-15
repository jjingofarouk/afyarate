import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isFacilitiesReady } from "@/lib/facilities";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiter: allow a handful of submissions per IP per hour.
// (In a production deploy you would use a real store, e.g. Redis.)
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
const buckets = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const hits = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    buckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  buckets.set(ip, hits);
  return false;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ?? "unknown").split(",")[0].trim();
}

export async function POST(req: NextRequest) {
  if (!(await isFacilitiesReady())) {
    return NextResponse.json({ error: "Database not ready" }, { status: 503 });
  }

  const ip = clientIp(req);
  if (limited(ip)) {
    return NextResponse.json(
      { error: "Too many ratings from this device. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as {
    facilityId?: unknown;
    rating?: unknown;
    comment?: unknown;
    reviewerName?: unknown;
  };
  const facilityId = Number(b.facilityId);
  const rating = Number(b.rating);
  const comment = typeof b.comment === "string" ? b.comment.trim().slice(0, 1000) : "";
  const reviewerName =
    typeof b.reviewerName === "string" ? b.reviewerName.trim().slice(0, 80) : "";

  if (!Number.isInteger(facilityId) || facilityId <= 0) {
    return NextResponse.json({ error: "Missing facilityId" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be an integer between 1 and 5" },
      { status: 400 },
    );
  }

  const supabase = createServerClient();

  // Make sure the facility exists.
  const { data: exists, error: checkErr } = await supabase
    .from("facilities")
    .select("id")
    .eq("id", facilityId)
    .maybeSingle();
  if (checkErr || !exists) {
    return NextResponse.json({ error: "Facility not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("facility_ratings")
    .insert({
      facility_id: facilityId,
      rating,
      comment: comment || null,
      reviewer_name: reviewerName || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rating: data }, { status: 201 });
}
