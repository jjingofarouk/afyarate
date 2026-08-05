import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms governing use of ${SITE_NAME}, including rules for submitting patient ratings.`,
  alternates: { canonical: "/terms" },
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

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Terms of Use
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Last updated: 5 August 2026
      </p>

      <p className="mt-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        These Terms of Use (&quot;Terms&quot;) are a binding agreement between you and{" "}
        {SITE_NAME} (&quot;{SITE_NAME}&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
        governing your access to and use of the {SITE_NAME} website and any related services
        (together, the &quot;Service&quot;). By accessing or using the Service, you agree to be
        bound by these Terms. If you do not agree, do not use the Service.
      </p>

      <S n="1" title="What the Service is">
        <p>
          {SITE_NAME} is a public directory of health professionals licensed to practice in
          Uganda. It republishes licensing and registration information originally published by
          the Uganda Medical &amp; Dental Practitioners Council (UMPDC), the Uganda Nurses &amp;
          Midwives Council, the Allied Health Professionals Council, and related official bodies
          (together, the &quot;Councils&quot;), and allows members of the public to submit
          star ratings and written comments (&quot;Ratings&quot;) about their experiences with
          individual practitioners.
        </p>
        <p>
          {SITE_NAME} is an independent, unofficial project. It is not operated, endorsed,
          verified, or affiliated with any Council, the Government of Uganda, or any
          practitioner listed on the Service.
        </p>
      </S>

      <S n="2" title="Eligibility">
        <p>
          You must be at least 18 years old, or the age of majority in your jurisdiction, to
          submit a Rating. By submitting a Rating you represent that you meet this requirement
          and that the experience you are describing is genuinely your own.
        </p>
      </S>

      <S n="3" title="Licensing data is republished, not verified by us">
        <p>
          Registration status, licence status, licence numbers, expiry dates, qualifications,
          and photographs displayed for each practitioner are copied from data published by the
          Councils and may be delayed, incomplete, out of date, or contain errors introduced at
          the source or during collection. We do not independently verify this information
          against the Councils&apos; records before or after publishing it, and we do not
          guarantee its accuracy, completeness, or currency at any given time.
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-100">
            Do not rely on {SITE_NAME} as the sole basis for any decision about a practitioner
            &mdash; medical, legal, employment, credentialing, or otherwise.
          </strong>{" "}
          Always verify a practitioner&apos;s current registration and licence status directly
          with the relevant Council before making decisions that depend on it, especially in
          urgent or safety-critical situations.
        </p>
        <p>
          If you are a practitioner and believe information about you is incorrect, out of
          date, or should not be published, contact us using the details in Section 15 and we
          will review the request. Corrections to underlying licensing facts should also be
          raised with the relevant Council, since we source from their published data.
        </p>
      </S>

      <S n="4" title="Ratings are opinions, not endorsements or medical advice">
        <p>
          Ratings and comments are submitted by members of the public and reflect the personal
          opinions and experiences of the individuals who submit them. They are not verified,
          fact-checked, edited for accuracy, or endorsed by {SITE_NAME} before or after
          publication, and they do not represent our views.
        </p>
        <p>
          Nothing on the Service constitutes medical advice, a medical opinion, a professional
          referral, or a substitute for consultation with a qualified health professional.
          Ratings reflect subjective patient experience &mdash; such as communication,
          professionalism, or wait times &mdash; and are not a measure of clinical competence,
          medical outcomes, or fitness to practice.
        </p>
      </S>

      <S n="5" title="Rules for submitting Ratings">
        <p>When you submit a Rating, you agree that it will:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>describe a genuine, first-hand experience with the practitioner named;</li>
          <li>be truthful to the best of your knowledge and not knowingly false or misleading;</li>
          <li>not be defamatory, and not state or imply criminal conduct, dishonesty, or
            professional misconduct unless you have a good-faith, reasonable basis for the
            statement;</li>
          <li>not contain hate speech, threats, harassment, or content that targets a
            practitioner&apos;s protected characteristics (race, religion, sex, disability,
            ethnicity, or similar) rather than their professional conduct;</li>
          <li>not contain another person&apos;s private or medical information (including your
            own diagnosis or treatment details, if you would not want them made public);</li>
          <li>not be submitted for payment, on behalf of a competitor, as part of a coordinated
            campaign, or otherwise for a purpose other than sharing a genuine patient
            experience;</li>
          <li>not impersonate any person or misrepresent your affiliation with any person or
            organisation; and</li>
          <li>not contain spam, advertising, malware, or unlawful content.</li>
        </ul>
        <p>
          Optional fields such as a display name are shown publicly exactly as entered. Do not
          enter information you do not want visible to the public.
        </p>
      </S>

      <S n="6" title="Our right to moderate and remove content">
        <p>
          We may, but are not obligated to, review, edit, refuse to publish, or remove any
          Rating at our sole discretion, with or without notice, including in response to a
          complaint, a report of inaccuracy, a legal request, or our own judgement that a
          Rating does not comply with Section 5. We are not obligated to notify the submitter
          of a Rating before or after removing it.
        </p>
        <p>
          A practitioner or any other person who believes a specific Rating is false,
          defamatory, or otherwise violates these Terms may report it using the contact details
          in Section 15. Include the practitioner&apos;s profile URL, the specific Rating in
          question, and the reason for the report. We will review reports but do not guarantee
          any particular outcome or timeframe.
        </p>
      </S>

      <S n="7" title="Licence to content you submit">
        <p>
          You retain ownership of any Rating or comment you submit. By submitting it, you grant
          {" " + SITE_NAME} a worldwide, royalty-free, perpetual, irrevocable, sublicensable
          licence to host, store, reproduce, publicly display, and distribute that content as
          part of the Service, including in cached, archived, or syndicated form, even if you
          later stop using the Service. You waive any claim to compensation for this use.
        </p>
      </S>

      <S n="8" title="Prohibited conduct">
        <p>In addition to Section 5, you agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>scrape, harvest, or bulk-extract data from the Service other than through the
            sitemap or pages as rendered for ordinary browsing;</li>
          <li>submit multiple Ratings for the same practitioner to manipulate an average
            rating, whether using one device or several;</li>
          <li>attempt to bypass, disable, or interfere with moderation, rate-limiting, or
            security features;</li>
          <li>use automated means (bots, scripts) to submit Ratings or access the Service at a
            volume or pattern a human would not;</li>
          <li>probe, scan, or test the vulnerability of the Service, or attempt to gain
            unauthorised access to any part of it or its underlying infrastructure; or</li>
          <li>use the Service in any way that violates applicable Ugandan or international
            law.</li>
        </ul>
      </S>

      <S n="9" title="Intellectual property">
        <p>
          The {SITE_NAME} name, logo, design, and site software are owned by us or our
          licensors and are not licensed to you except as necessary to use the Service
          normally. Licensing data originates from the Councils and remains subject to
          whatever rights they hold in it; we make no ownership claim over it beyond our
          compilation and presentation of it.
        </p>
      </S>

      <S n="10" title='Disclaimers ("as is" service)'>
        <p>
          THE SERVICE, INCLUDING ALL LICENSING DATA AND ALL RATINGS, IS PROVIDED &quot;AS
          IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER
          EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, OR
          THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE. WE DO NOT
          WARRANT OR GUARANTEE THE ACCURACY, TRUTHFULNESS, RELIABILITY, OR COMPLETENESS OF ANY
          LICENSING DATA OR ANY RATING, WHETHER SUBMITTED BY A USER OR SOURCED FROM A COUNCIL.
        </p>
      </S>

      <S n="11" title="Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {SITE_NAME}, ITS OPERATOR, AND
          ITS CONTRIBUTORS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA,
          GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING FROM OR RELATING TO: (A) YOUR USE OF OR
          INABILITY TO USE THE SERVICE; (B) ANY LICENSING DATA, RATING, OR OTHER CONTENT ON THE
          SERVICE, OR ANY DECISION MADE IN RELIANCE ON IT; (C) ANY CONDUCT OR CONTENT OF ANY
          THIRD PARTY, INCLUDING OTHER USERS AND PRACTITIONERS; OR (D) UNAUTHORISED ACCESS TO
          OR ALTERATION OF YOUR SUBMISSIONS OR DATA. THIS APPLIES REGARDLESS OF THE LEGAL
          THEORY ASSERTED, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. TO
          THE EXTENT ANY LIABILITY CANNOT BE EXCLUDED UNDER APPLICABLE LAW, OUR TOTAL
          AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE IS LIMITED TO USD 100.
        </p>
        <p>
          Some jurisdictions do not allow the exclusion of certain warranties or the limitation
          of certain damages, so some of the above limitations may not apply to you in full.
        </p>
      </S>

      <S n="12" title="Indemnification">
        <p>
          You agree to indemnify and hold harmless {SITE_NAME}, its operator, and its
          contributors from any claim, demand, loss, or liability, including reasonable legal
          fees, arising out of or connected with: (a) any Rating or other content you submit;
          (b) your violation of these Terms; or (c) your violation of any right of a third
          party, including a practitioner&apos;s rights.
        </p>
      </S>

      <S n="13" title="Third-party services and links">
        <p>
          The Service uses third-party infrastructure providers, including Supabase (database
          hosting), Cloudflare (hosting and content delivery), and Google Analytics (usage
          analytics). Their use of your data is governed by their own terms and privacy
          policies, not this document. The Service may also link to third-party websites,
          including the Councils&apos; own portals; we are not responsible for the content or
          practices of any site we do not operate.
        </p>
      </S>

      <S n="14" title="Changes, suspension, and termination">
        <p>
          We may modify, suspend, or discontinue any part of the Service, including specific
          listings or the ability to submit Ratings, at any time and without notice. We may
          update these Terms from time to time; the &quot;Last updated&quot; date above will
          reflect the most recent revision, and continued use of the Service after an update
          constitutes acceptance of the revised Terms. We may restrict or terminate your
          access to the Service, including your ability to submit Ratings, if we believe you
          have violated these Terms.
        </p>
      </S>

      <S n="15" title="Contact and reports">
        <p>
          Questions about these Terms, correction requests, or reports of content that
          violates them can be sent via our{" "}
          <Link href="/contact" className="text-emerald-700 underline dark:text-emerald-400">
            contact form
          </Link>{" "}
          or{" "}
          <a className="text-emerald-700 underline dark:text-emerald-400" href="tel:+256751360385">
            +256 751 360 385
          </a>.
        </p>
      </S>

      <S n="16" title="Governing law">
        <p>
          These Terms are governed by the laws of the Republic of Uganda, without regard to
          conflict-of-law principles. Any dispute arising from these Terms or the Service is
          subject to the exclusive jurisdiction of the courts of Uganda.
        </p>
      </S>

      <S n="17" title="Severability and entire agreement">
        <p>
          If any provision of these Terms is found unenforceable, the remaining provisions
          will remain in full effect and the unenforceable provision will be interpreted to
          best reflect its intent. These Terms, together with our{" "}
          <Link href="/privacy" className="text-emerald-700 underline dark:text-emerald-400">
            Privacy Policy
          </Link>
          , are the entire agreement between you and {SITE_NAME} regarding the Service.
        </p>
      </S>

      <p className="mt-10 text-xs text-slate-400 dark:text-slate-500">
        This page is provided as a general-purpose terms of use and does not constitute legal
        advice to you or to any reader.
      </p>
    </div>
  );
}
