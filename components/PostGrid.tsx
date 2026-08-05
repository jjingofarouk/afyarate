import PostCard from "@/components/PostCard";
import type { Post } from "@/lib/types";

export default function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
