import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Musawo · Rate Uganda's Health Workers",
    template: "%s · Musawo",
  },
  description:
    "Search every licensed doctor, nurse, pharmacist and allied health professional in Uganda — see patient ratings and leave your own.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
                +
              </span>
              <span className="text-lg font-semibold tracking-tight">Musawo</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-emerald-700">
                Search
              </Link>
              <Link href="/about" className="hover:text-emerald-700">
                About
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 text-xs leading-relaxed text-slate-500">
            <p className="mb-2 font-semibold text-slate-700">Musawo</p>
            <p>
              Licensing data is official data provided by the Uganda Medical &amp;
              Dental Practitioners Council (UMPDC) and shows the registered/licence
              status as published. Ratings are community opinions and are not medical
              advice, an endorsement, or a substitute for professional judgement.
              If you believe information is wrong, verify with the regulator or
              the portal directly.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
