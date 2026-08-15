import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses, and protects information.`,
  alternates: { canonical: "/privacy" },
};

function S({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {n}. {title}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Last updated: 5 August 2026
      </p>

      <p className="mt-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        This Privacy Policy explains what information {SITE_NAME} collects when you use the
        website, why we collect it, how it is used and shared, and the choices available to
        you. It should be read together with our{" "}
        <Link href="/terms" className="text-emerald-700 underline dark:text-emerald-400">
          Terms of Use
        </Link>
        .
      </p>

      <S n="1" title="Information you provide to us">
        <p>When you submit a Rating for a practitioner, we collect:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>the star rating (1&ndash;5) you select;</li>
          <li>any written comment you choose to add;</li>
          <li>a display name, if you choose to provide one (this field is optional &mdash; if
            left blank, your Rating is shown publicly as &quot;Anonymous&quot;); and</li>
          <li>which practitioner profile the Rating is attached to, and the time it was
            submitted.</li>
        </ul>
        <p>
          A Rating and any name or comment you include with it are displayed publicly on the
          practitioner&apos;s profile page as soon as it is submitted. Do not include your
          real name, contact details, or anything else you do not want to be public, unless
          you intend for it to be public.
        </p>
        <p>
          We do not currently offer user accounts, so we do not collect passwords or require
          you to register to submit a Rating.
        </p>
      </S>

      <S n="2" title="Information collected automatically">
        <p>
          Like most websites, our hosting and analytics providers automatically log certain
          technical information when you visit, including your IP address, browser and device
          type, pages viewed, referring page, and timestamps. We use{" "}
          <a
            className="text-emerald-700 underline dark:text-emerald-400"
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Google Analytics
          </a>{" "}
          to understand how the Service is used (for example, which pages are visited and how
          often), which sets cookies and collects usage data in your browser on our behalf. Our
          hosting provider, Cloudflare, also processes connection-level data (such as IP
          address) as part of delivering the site and protecting it from abuse.
        </p>
      </S>

      <S n="3" title="Cookies">
        <p>
          The Service uses cookies set by Google Analytics to distinguish users and sessions
          for analytics purposes, and a local storage entry on your device to remember your
          light/dark theme preference (this is not a cookie and is not transmitted to us). We
          do not use cookies for advertising or to build a profile of you for marketing
          purposes. You can block or delete cookies in your browser settings; doing so may
          affect analytics but will not prevent you from browsing the Service or submitting a
          Rating.
        </p>
      </S>

      <S n="4" title="How we use information">
        <p>We use the information described above to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>display Ratings publicly on the relevant practitioner&apos;s profile;</li>
          <li>calculate aggregate figures such as average rating and rating counts;</li>
          <li>operate, maintain, secure, and improve the Service;</li>
          <li>understand aggregate usage patterns through analytics;</li>
          <li>detect, investigate, and prevent abuse, spam, or violations of our{" "}
            <Link href="/terms" className="text-emerald-700 underline dark:text-emerald-400">
              Terms of Use
            </Link>
            ; and</li>
          <li>comply with legal obligations and respond to lawful requests.</li>
        </ul>
      </S>

      <S n="5" title="How we share information">
        <p>
          Ratings, comments, and any display name you provide are public by design and visible
          to anyone who views the relevant profile page &mdash; this is the core function of
          the Service, not a disclosure to a third party in the ordinary sense.
        </p>
        <p>Beyond that, we share information with:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-slate-900 dark:text-slate-100">Supabase</strong>, which
            hosts our database and stores Ratings and the licensing registry;
          </li>
          <li>
            <strong className="text-slate-900 dark:text-slate-100">Cloudflare</strong>, which
            hosts the Service and provides content delivery and security filtering; and
          </li>
          <li>
            <strong className="text-slate-900 dark:text-slate-100">Google Analytics</strong>,
            which processes usage data as described in Section 2.
          </li>
        </ul>
        <p>
          We do not sell personal information, and we do not share it with third parties for
          their own marketing purposes. We may disclose information if required by law, court
          order, or a valid legal request, or where necessary to protect the rights, property,
          or safety of {SITE_NAME}, our users, or the public.
        </p>
      </S>

      <S n="6" title="Data retention">
        <p>
          Ratings and comments are retained for as long as the associated practitioner profile
          remains on the Service, since they form part of the public record the Service exists
          to provide, unless removed under our{" "}
          <Link href="/terms" className="text-emerald-700 underline dark:text-emerald-400">
            Terms of Use
          </Link>{" "}
          or at your request as described in Section 8. Analytics data is retained according
          to Google Analytics&apos; standard retention settings.
        </p>
      </S>

      <S n="7" title="Security">
        <p>
          We take reasonable technical measures to protect information on the Service,
          including transport encryption (HTTPS) and access controls on our database. No
          method of transmission or storage is completely secure, and we cannot guarantee
          absolute security of any information you submit.
        </p>
      </S>

      <S n="8" title="Your rights and choices">
        <p>
          If you submitted a Rating and want it corrected or removed &mdash; for example
          because it contains information you did not intend to make public &mdash; contact us
          at the details in Section 11 with enough detail to locate it (practitioner profile
          URL, approximate date, and content). Because Ratings are not linked to an account, we
          cannot verify that a removal request comes from the original submitter and may ask
          for reasonable supporting detail before acting on it.
        </p>
        <p>
          If you are in Uganda, the Data Protection and Privacy Act, 2019 gives you rights
          including the right to access information held about you, request correction, and
          object to certain processing; if you are located elsewhere, you may have similar
          rights under your local law. Contact us to make a request and we will respond as
          required by applicable law.
        </p>
      </S>

      <S n="9" title="Children">
        <p>
          The Service is not directed at children, and we do not knowingly collect information
          from anyone under 18. If you believe a child has submitted information to us,
          contact us and we will remove it.
        </p>
      </S>

      <S n="10" title="International data transfer">
        <p>
          Our infrastructure providers (Supabase, Cloudflare, Google Analytics) may process and
          store data on servers located outside Uganda. By using the Service, you understand
          that your information may be transferred to and processed in countries with data
          protection laws that differ from those in your own country.
        </p>
      </S>

      <S n="11" title="Contact">
        <p>
          Questions about this Privacy Policy, or requests relating to your information, can be
          sent via our{" "}
          <Link href="/contact" className="text-emerald-700 underline dark:text-emerald-400">
            contact form
          </Link>
          .
        </p>
      </S>

      <S n="12" title="Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. The &quot;Last updated&quot;
          date above reflects the most recent revision. Material changes will be reflected on
          this page; continued use of the Service after a change constitutes acceptance of the
          updated policy.
        </p>
      </S>

      <p className="mt-10 text-xs text-slate-400 dark:text-slate-500">
        This page is provided as a general-purpose privacy policy and does not constitute
        legal advice to you or to any reader.
      </p>
    </div>
  );
}
