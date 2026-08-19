import { NextResponse } from "next/server";
import { getProfessions, getLocations } from "@/lib/posts";

// Cache for 10 minutes — these change rarely and getPosts() is already cached
export const revalidate = 600;

export async function GET() {
  const [professions, locations] = await Promise.all([getProfessions(), getLocations()]);
  return NextResponse.json({
    professions: professions.map((p) => p.label),
    locations: locations.map((l) => l.label),
  });
}
