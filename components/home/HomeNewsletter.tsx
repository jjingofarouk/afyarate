import type { CSSProperties } from "react";
import { getLocations, getProfessions } from "@/lib/posts";
import Newsletter from "@/components/Newsletter";
import HomeSection from "@/components/home/HomeSection";
import { MailIcon } from "@/components/home/HomeIcons";
import { SlideIn } from "@/components/motion/SlideIn";

/**
 * Job-alerts newsletter block. Pinned after the shuffled discovery trio.
 * Options derive from the shared cached posts read, so no extra DB round
 * trip once any listing block has warmed the worker.
 */
export default async function HomeNewsletter({ style }: { style?: CSSProperties }) {
  const [newsletterProfessions, newsletterLocations] = await Promise.all([
    getProfessions().catch(() => []),
    getLocations().catch(() => []),
  ]);
  const roleOptions = newsletterProfessions.map((p) => p.label);
  const locationOptions = newsletterLocations.map((l) => l.label);

  return (
    <HomeSection
      id="newsletter"
      style={style}
      tone="emerald"
      eyebrow="Job alerts"
      eyebrowIcon={<MailIcon />}
      title="New jobs, straight to your inbox"
      description="Never miss an opening. Subscribe and get fresh jobs, scholarships, grants and conferences across Uganda delivered by email."
    >
      <SlideIn from="bottom">
        <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-100 bg-white/70 p-6 sm:p-8 dark:border-emerald-900/40 dark:bg-slate-900/60">
          <Newsletter roleOptions={roleOptions} locationOptions={locationOptions} />
        </div>
      </SlideIn>
    </HomeSection>
  );
}
