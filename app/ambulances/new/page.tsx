import type { Metadata } from "next";
import Link from "next/link";
import AmbulanceRegisterForm from "@/components/AmbulanceRegisterForm";

export const metadata: Metadata = {
  title: "Register Your Ambulance Service",
  description: "List your ambulance or patient transport service on Rate Musawo. Reviewed before publishing.",
  alternates: { canonical: "/ambulances/new" },
};

export default function NewAmbulancePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <nav className="mb-6 text-xs text-slate-400 dark:text-slate-500">
        <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/ambulances" className="hover:text-emerald-700 dark:hover:text-emerald-400">Ambulances</Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-600 dark:text-slate-400">Register</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Register your ambulance service
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Reach people across Uganda who need emergency transport. Free to list, reviewed by our
        team before it goes live.
      </p>

      <div className="mt-6">
        <AmbulanceRegisterForm />
      </div>
    </div>
  );
}
