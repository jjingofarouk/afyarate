import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPractitioner } from "@/lib/practitioners";
import ProfileDetailsForm, { SupportLinks } from "@/components/ProfileDetailsForm";

export const metadata: Metadata = {
  title: "Edit your profile",
  robots: { index: false, follow: false },
};

export default async function EditProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const practitioner = await getPractitioner(Number(id));
  if (!practitioner) notFound();

  if (!t || !practitioner.claimed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
          This edit link isn&apos;t valid
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Edit links are personal — they&apos;re issued when you claim your profile.
          If you&apos;ve lost yours, contact us and we&apos;ll re-issue it.
        </p>
        <Link
          href="/contact?topic=claim"
          className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          Contact support
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
          Profile claimed · Paid in full
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Make your profile shine
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          The more patients know about you, the more likely they are to choose you.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <ProfileDetailsForm
          practitionerId={Number(id)}
          token={t}
          name={practitioner.name}
        />
        <SupportLinks />
      </div>
    </div>
  );
}
