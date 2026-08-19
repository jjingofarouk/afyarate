import { createAdminClient } from "@/lib/supabase/admin";
import { getProfessions, getLocations } from "@/lib/posts";
import ManageNewsletterForm from "@/components/ManageNewsletterForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Newsletter Preferences | Rate Musawo",
  robots: { index: false },
};

export default async function NewsletterManagePage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await props.searchParams;

  if (!token?.trim()) return <InvalidLink />;

  const supabase = createAdminClient();
  const { data: sub } = await supabase
    .from("newsletter_subscribers")
    .select("email, first_name, last_name, opportunity_types, roles, regions, status")
    .eq("manage_token", token.trim())
    .single();

  if (!sub) return <NotFound />;

  const [professions, locations] = await Promise.all([getProfessions(), getLocations()]);

  return (
    <ManageNewsletterForm
      subscriber={{
        email: sub.email,
        firstName: sub.first_name ?? "",
        lastName: sub.last_name ?? "",
        types: sub.opportunity_types ?? [],
        roles: sub.roles ?? [],
        regions: sub.regions ?? [],
        status: sub.status ?? "subscribed",
      }}
      roleOptions={professions.map((p) => p.label)}
      locationOptions={locations.map((l) => l.label)}
    />
  );
}

function InvalidLink() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 p-8 dark:bg-slate-950">
      <div className="max-w-sm text-center">
        <p className="text-4xl">🔗</p>
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-50">Invalid link</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This preferences link looks broken. Check your email for the correct link.
        </p>
        <a href="/"
          className="mt-6 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
          Back to Rate Musawo
        </a>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 p-8 dark:bg-slate-950">
      <div className="max-w-sm text-center">
        <p className="text-4xl">🔍</p>
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-50">Link not recognised</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This preferences link has expired or is invalid. Check your latest email from Rate Musawo for a fresh link.
        </p>
        <a href="/"
          className="mt-6 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
          Back to Rate Musawo
        </a>
      </div>
    </div>
  );
}
