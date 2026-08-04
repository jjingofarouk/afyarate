import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isDbReady } from "@/lib/practitioners";

export const dynamic = "force-dynamic";

// Simple in-memory rate limiter: allow a handful of submissions per IP per hour.
// (In a production deploy you would use a real store.)
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
  if (!isDbReady()) {
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
    practitionerId?: unknown;
    rating?: unknown;
    comment?: unknown;
    reviewerName?: unknown;
  };
  const practitionerId = Number(b.practitionerId);
  const rating = Number(b.rating);
  const comment = typeof b.comment === "string" ? b.comment.trim().slice(0, 1000) : "";
  const reviewerName =
    typeof b.reviewerName === "string" ? b.reviewerName.trim().slice(0, 80) : "";

  if (!Number.isInteger(practitionerId) || practitionerId <= 0) {
    return NextResponse.json({ error: "Missing practitionerId" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be an integer between 1 and 5" },
      { status: 400 },
    );
  }

  const db = getDb();
  const exists = db
    .prepare("SELECT id FROM practitioners WHERE id = ?")
    .get(practitionerId);
  if (!exists) {
    return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
  }

  const info = db
    .prepare(
      "INSERT INTO ratings (practitioner_id, rating, comment, reviewer_name) VALUES (?, ?, ?, ?)",
    )
    .run(practitionerId, rating, comment || null, reviewerName || null);

  const row = db
    .prepare(
      `SELECT id, practitioner_id AS practitionerId, rating, comment,
              reviewer_name AS reviewerName, created_at AS createdAt, verified
       FROM ratings WHERE id = ?`,
    )
    .get(Number(info.lastInsertRowid));

  return NextResponse.json({ rating: row }, { status: 201 });
}
