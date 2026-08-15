import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminPost } from "@/lib/admin-posts";
import PostForm from "@/components/admin/PostForm";

export const dynamic = "force-dynamic";

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getAdminPost(id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/posts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
      >
        ← Back to listings
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Edit listing
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Update the details below. Changes are reflected on the public board after
        you save.
      </p>
      <div className="mt-6">
        <PostForm post={post} />
      </div>
    </div>
  );
}
