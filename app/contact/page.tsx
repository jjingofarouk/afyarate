import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE_NAME}: questions, corrections, or reports about content.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;

  return (
    <>
      {/* Full-bleed brand band using the team's artwork. */}
      <section className="relative flex min-h-[240px] items-end overflow-hidden sm:min-h-[300px] lg:min-h-[340px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/contact-hero.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-950/20" />
        <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
            Get in touch
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {topic === "claim" ? "Claim your profile" : "Contact us"}
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {topic === "claim"
            ? "Own your health worker profile: add your phone/WhatsApp, workplace and specialties so patients can reach you. Send us your details below and we'll verify your licence and get you set up."
            : "Questions, corrections, or reports about content: send us a message and we'll get back to you."}
        </p>

      <div className="mt-8">
        <ContactForm initialTopic={topic === "claim" ? "claim" : undefined} />
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
    </>
  );
}
