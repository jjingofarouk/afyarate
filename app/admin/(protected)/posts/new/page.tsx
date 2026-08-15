import Link from "next/link";
import PostForm from "@/components/admin/PostForm";

export const dynamic = "force-dynamic";

export default function AdminNewPostPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/posts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
      >
        ← Back to listings
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        New listing
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Create a job, scholarship, grant or opportunity directly. You can publish
        immediately or save it as a draft.
      </p>
      <div className="mt-6">
        <PostForm />
      </div>
    </div>
  );
}
