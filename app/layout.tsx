import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import ThemeToggle, { ThemeInitScript } from "@/components/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · Rate Uganda's Health Workers`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Uganda doctors",
    "find a doctor Uganda",
    "health worker ratings Uganda",
    "UMDPC registry",
    "licensed nurses Uganda",
    "Uganda medical council",
    "rate a doctor",
    "Musawo",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_UG",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · Rate Uganda's Health Workers`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/logo.png", width: 1254, height: 1254, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Rate Uganda's Health Workers`,
    description: SITE_DESCRIPTION,
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-YFWL8BL1F8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-YFWL8BL1F8');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt={`${SITE_NAME} logo`}
                width={36}
                height={36}
                priority
                className="rounded-full object-cover"
              />
              <span className="text-lg font-semibold tracking-tight">{SITE_NAME}</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-3">
              <DesktopNav />
              <ThemeToggle />
              <MobileNav />
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-8 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            <p className="mb-2 font-semibold text-slate-700 dark:text-slate-300">{SITE_NAME}</p>
            <p>
              Licensing data is official data provided by the Uganda Medical &amp;
              Dental Practitioners Council (UMPDC) and shows the registered/licence
              status as published. Ratings are community opinions and are not medical
              advice, an endorsement, or a substitute for professional judgement.
              If you believe information is wrong, verify with the regulator or
              the portal directly.
            </p>
            <p className="mt-3">
              Questions or corrections?{" "}
              <Link className="text-emerald-700 underline dark:text-emerald-400" href="/contact">
                Contact us
              </Link>{" "}
              or call{" "}
              <a className="text-emerald-700 underline dark:text-emerald-400" href="tel:+256751360385">
                +256 751 360 385
              </a>.
            </p>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/terms" className="text-emerald-700 underline dark:text-emerald-400">
                Terms of Use
              </Link>
              <Link href="/privacy" className="text-emerald-700 underline dark:text-emerald-400">
                Privacy Policy
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
