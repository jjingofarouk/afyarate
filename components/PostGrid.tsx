import { Fragment } from "react";
import PostCard from "@/components/PostCard";
import SubscribeTeaser from "@/components/SubscribeTeaser";
import type { Post } from "@/lib/types";

const TEASER_AFTER = 6;

export default function PostGrid({ posts, hideTeaser = false }: { posts: Post[]; hideTeaser?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p, i) => (
        <Fragment key={p.id}>
          <PostCard post={p} />
          {!hideTeaser && i === TEASER_AFTER - 1 && posts.length > TEASER_AFTER && (
            <SubscribeTeaser />
          )}
        </Fragment>
      ))}
    </div>
  );
}
