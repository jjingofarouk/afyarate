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
};

export default nextConfig;
