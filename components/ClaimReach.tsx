import { getStats } from "@/lib/practitioners";
import { getFacilityStats } from "@/lib/facilities";
import { getPosts } from "@/lib/posts";

/**
 * Social proof for the claim pages: live counts straight from the database
 * (no made-up traffic numbers). Shows claimants the audience already in
 * place — every practitioner and facility page is a page patients land on.
 */
export default async function ClaimReach() {
  const [stats, facilities, posts] = await Promise.all([
    getStats().catch(() => null),
    getFacilityStats().catch(() => null),
    getPosts().catch(() => []),
  ]);
  if (!stats) return null;

  const tiles = [
    {
      value: stats.practitioners.toLocaleString("en-US"),
      label: "Practitioner pages patients search",
    },
    {
      value: (facilities?.total ?? 0).toLocaleString("en-US"),
      label: "Hospitals & pharmacies listed",
    },
    {
      value: posts.length.toLocaleString("en-US"),
      label: "Live jobs & opportunities",
    },
    {
      value: stats.totalRatings.toLocaleString("en-US"),
      label: "Patient ratings and counting",
    },
  ];

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
        Patients land here every day looking for someone like you
      </p>
      <p className="mt-1 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-300/80">
        Every profile below is a page patients find, read and act on. Claiming
        puts your phone number and photo on yours.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-xl border border-emerald-100 bg-white px-3 py-3 text-center dark:border-emerald-900/40 dark:bg-slate-900"
          >
            <p className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">
              {t.value}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              {t.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
