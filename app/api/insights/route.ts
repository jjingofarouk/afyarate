import { NextResponse } from "next/server";
import { getPosts } from "@/lib/posts";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Market insights over published listings (mirrors legacy insights.php):
// board mix, salary transparency, closing soon, application leaders.
export async function GET() {
  try {
    const posts = await getPosts();
    const open = posts.filter((p) => {
      if (!p.deadline) return true;
      return new Date(`${p.deadline}T00:00:00`).getTime() >= Date.now() - 86400000;
    });
    const countBy = (pick: (p: (typeof posts)[number]) => string | null) => {
      const m = new Map<string, number>();
      for (const p of open) {
        const v = pick(p)?.trim();
        if (v) m.set(v, (m.get(v) ?? 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
    };
    const withSalary = open.filter((p) => p.salary && p.salary.trim()).length;
    const closingSoon = open.filter((p) => {
      if (!p.deadline) return false;
      const days = (new Date(`${p.deadline}T00:00:00`).getTime() - Date.now()) / 86400000;
      return days >= 0 && days <= 14;
    }).length;

    // Application leaders (best effort: needs the service key).
    let mostApplied: { title: string; slug: string; count: number }[] = [];
    let avgApplications: number | null = null;
    try {
      const admin = createAdminClient();
      const { data: apps } = await admin.from("applications").select("post_id");
      const perPost = new Map<number, number>();
      for (const a of ((apps ?? []) as { post_id: number }[])) {
        perPost.set(a.post_id, (perPost.get(a.post_id) ?? 0) + 1);
      }
      if (perPost.size > 0) {
        const ids = [...perPost.keys()];
        const { data: listed } = await admin.from("posts").select("id, title, slug").in("id", ids).eq("status", "published");
        const titles = new Map(((listed ?? []) as { id: number; title: string; slug: string }[]).map((p) => [p.id, p]));
        mostApplied = [...perPost.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .filter(([id]) => titles.has(id))
          .map(([id, count]) => ({ title: titles.get(id)?.title ?? "", slug: titles.get(id)?.slug ?? "", count }));
        const total = [...perPost.values()].reduce((a, b) => a + b, 0);
        avgApplications = Math.round((total / Math.max(1, open.length)) * 10) / 10;
      }
    } catch {
      // Service key missing: application stats stay empty.
    }

    return NextResponse.json({
      open: open.length,
      closingSoon,
      salaryTransparency: open.length > 0 ? Math.round((withSalary / open.length) * 100) : 0,
      byProfession: countBy((p) => p.profession),
      byLocation: countBy((p) => p.location),
      byType: countBy((p) => p.type),
      byOrganization: countBy((p) => p.organization),
      avgApplications,
      mostApplied,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}
