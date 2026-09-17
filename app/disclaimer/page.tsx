import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `${SITE_NAME} is an opportunity-listing platform. Publishing a listing is not a guarantee of employment, funding, admission or organizational endorsement.`,
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Disclaimer
      </h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <p>
          {SITE_NAME} is an opportunity-listing platform. Publication of a listing is not a
          guarantee of employment, funding, admission, scholarship selection or organizational
          endorsement.
        </p>
        <p>
          Listings are aggregated and reviewed for relevance, but the organization&apos;s own
          advert is always the authoritative source. Always verify application instructions with
          the recruiting organization directly, and check deadlines and requirements before
          applying.
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Never send money to secure an opportunity
        </h2>
        <p>
          No genuine employer asks for payment merely to consider an application. Never send money
          to unverified recruiters or individuals claiming to guarantee selection. If a request
          looks suspicious,{" "}
          <Link href="/help/guides/safety" className="text-emerald-700 underline dark:text-emerald-400">
            read the applicant safety guide
          </Link>{" "}
          and use the report button on the listing page.
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Registry and licensing information
        </h2>
        <p>
          Licensing information is republished from official council sources and may lag the
          regulator&apos;s records. {SITE_NAME} is not affiliated with any council or regulator.
          Always verify directly with the relevant council or official portal for matters that
          matter, such as emergencies, legal or credentialing purposes.
        </p>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Ratings and market insights
        </h2>
        <p>
          Patient ratings are community opinions, not medical advice and not an official
          endorsement. Market insights are a signal derived from activity on this platform only
          and are not an official national labour-market estimate.
        </p>
        <p className="text-xs text-slate-500">
          See also our{" "}
          <Link href="/terms" className="underline">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
