import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import FacilityProfileDetailsForm from "@/components/FacilityProfileDetailsForm";

export const dynamic = "force-dynamic";

export default async function FacilityEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const fid = Number(id);
  if (!fid || !t) notFound();

  const db = createAdminClient();
  const [{ data: facility }, { data: claims }] = await Promise.all([
    db.from("facilities").select("id, name, slug, claimed").eq("id", fid).maybeSingle(),
    db
      .from("facility_claim_requests")
      .select("id")
      .eq("facility_id", fid)
      .eq("status", "paid")
      .eq("edit_token", t)
      .limit(1),
  ]);
  if (!facility || (claims?.length ?? 0) === 0) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Verified facility</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
        Manage {String(facility.name)}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Your photo, phone, services and description update live on your public page.
      </p>
      <div className="mt-6">
        <FacilityProfileDetailsForm facilityId={fid} token={t} name={String(facility.name)} />
      </div>
    </div>
  );
}
