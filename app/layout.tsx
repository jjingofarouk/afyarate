import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import ThemeToggle, { ThemeInitScript } from "@/components/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import HeaderSearch from "@/components/HeaderSearch";
import Footer from "@/components/Footer";
import NoCopyScript from "@/components/NoCopy";
import CopyNotice from "@/components/CopyNotice";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Uganda doctors",
    "find a doctor Uganda",
    "health worker ratings Uganda",
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
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: "/logo.png", width: 1254, height: 1254, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
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
        target: `${SITE_URL}/practitioners?q={search_term_string}`,
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
        <meta
          name="google-adsense-account"
          content="ca-pub-3215272580656507"
        />
        <ThemeInitScript />
        <NoCopyScript />
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
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <Image
                src="/logo.png"
                alt={`${SITE_NAME} logo`}
                width={36}
                height={36}
                priority
                className="rounded-full object-cover"
              />
              <span className="hidden text-lg font-semibold tracking-tight sm:inline">{SITE_NAME}</span>
            </Link>
            <div className="min-w-0 flex-1">
              <HeaderSearch />
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <MobileNav />
            </div>
          </div>
        </header>

        <main>{children}</main>

        <Footer />

        <CopyNotice />
      </body>
    </html>
  );
}
