import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE_NAME} — questions, corrections, or reports about content.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Contact us
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Questions, corrections, or reports about content: send us a message and
        we&apos;ll get back to you.
      </p>

      <div className="mt-8">
        <ContactForm />
      </div>

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        Corrections to licensing facts should also be raised with the relevant council,
        since we source from their published data. See our{" "}
        <Link href="/terms" className="text-emerald-700 underline dark:text-emerald-400">
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-emerald-700 underline dark:text-emerald-400">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
