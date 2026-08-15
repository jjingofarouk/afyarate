import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { default: "Admin", template: "%s · Admin" },
};

export default async function AdminProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <AdminNav />
      <main className="mt-6">{children}</main>
    </div>
  );
}
