import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl font-bold text-emerald-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Practitioner not found
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        We couldn&apos;t find that health worker. They may have been removed or the
        link is wrong.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Back to search
      </Link>
    </div>
  );
}
