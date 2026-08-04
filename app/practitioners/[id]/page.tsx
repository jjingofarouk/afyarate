import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLicenses,
  getPractitioner,
  getRatings,
} from "@/lib/practitioners";
import { InitialsAvatar } from "@/components/PractitionerCard";
import { Stars } from "@/components/Stars";
import RatingForm from "@/components/RatingForm";
import { Star } from "@/components/StarIcon";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = getPractitioner(Number(id));
  if (!p) return { title: "Not found" };
  return {
    title: `${p.name} — ${p.council ?? "Health professional"}`,
    description: `${p.name} (${p.council ?? "registered in Uganda"}). Patient ratings and licence information.`,
  };
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

export default async function PractitionerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const practitioner = getPractitioner(Number(id));
  if (!practitioner) notFound();

  const licenses = getLicenses(practitioner.id);
  const ratings = getRatings(practitioner.id);
  const active = practitioner.licenceStatus === "Active";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-700"
      >
        ← Back to search
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: photo + summary */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="aspect-[3/4] w-full overflow-hidden bg-slate-100">
              {practitioner.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={practitioner.imageUrl}
                  alt={practitioner.name}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <InitialsAvatar name={practitioner.name} />
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    active
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  Licence {practitioner.licenceStatus ?? "Unknown"}
                </span>
                {practitioner.recordCount > 1 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {practitioner.recordCount} licence records
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={18}
                      filled={n <= Math.round(practitioner.avgRating ?? 0)}
                    />
                  ))}
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {practitioner.avgRating ? practitioner.avgRating.toFixed(1) : "No ratings yet"}
                </span>
                {practitioner.ratingCount > 0 && (
                  <span className="text-xs text-slate-500">
                    ({practitioner.ratingCount} rating
                    {practitioner.ratingCount > 1 ? "s" : ""})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: details */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {practitioner.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{practitioner.council}</p>

            <dl className="mt-4">
              <Field
                label="Registration status"
                value={practitioner.registrationStatus}
              />
              <Field label="Registration No." value={practitioner.registrationNo} />
              <Field
                label="Registration date"
                value={practitioner.registrationDate}
              />
              <Field label="Licence number" value={practitioner.licenseNumber} />
              <Field
                label="Licence expiry"
                value={practitioner.licenseExpiryDate}
              />
            </dl>

            {practitioner.qualifications && (
              <div className="mt-5">
                <h2 className="text-sm font-semibold text-slate-900">
                  Qualifications
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  {practitioner.qualifications}
                </p>
              </div>
            )}
          </div>

          {/* Licence history */}
          {licenses.length > 1 && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Licence history ({licenses.length})
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-3">Licence No.</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Expiry</th>
                      <th className="py-2">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.map((l) => (
                      <tr key={l.id} className="border-b border-slate-100">
                        <td className="py-2 pr-3 font-mono text-xs text-slate-700">
                          {l.licenseNumber}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              l.licenceStatus === "Active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {l.licenceStatus}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-slate-600">
                          {l.licenseExpiryDate}
                        </td>
                        <td className="py-2 text-slate-600">
                          {l.registrationDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ratings */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <RatingForm practitionerId={practitioner.id} />

            <div>
              <h2 className="mb-3 text-base font-semibold text-slate-900">
                Patient ratings ({ratings.length})
              </h2>
              {ratings.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  No ratings yet. Be the first to share your experience.
                </p>
              ) : (
                <ul className="space-y-3">
                  {ratings.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <Stars value={r.rating} size={14} />
                        <span className="text-xs text-slate-400">
                          {new Date(r.createdAt + "Z").toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                          {r.comment}
                        </p>
                      )}
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {r.reviewerName ?? "Anonymous"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
