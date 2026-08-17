/** @type {import('next').NextConfig} */
const nextConfig = {
  // The official Uganda portal is slow and the images change often; serve them
  // as-is rather than running them through Next's optimizer.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.ehealthlicense.go.ug",
        pathname: "/images/**",
      },
    ],
    unoptimized: true,
  },
  eslint: { ignoreDuringBuilds: true },

  // Edge caching for content that rarely changes once published.
  // Cloudflare Workers honours s-maxage; stale-while-revalidate lets it serve
  // the cached copy while fetching a fresh one in the background.
  async headers() {
    return [
      {
        // Individual post/listing detail pages: cache for 24 hours at the edge.
        // The admin PATCH route calls caches.default.delete() on save so stale
        // content is evicted immediately when a post is updated.
        source: "/posts/:slug",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=3600",
          },
        ],
      },
      {
        // /jobs/[profession] pages: facet counts shift as new posts arrive,
        // so use a shorter 1-hour TTL with 5-minute SWR.
        source: "/jobs/:profession",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=300",
          },
        ],
      },
      {
        // /jobs index: same short TTL.
        source: "/jobs",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
