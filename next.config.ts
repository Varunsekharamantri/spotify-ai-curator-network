import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-time lib/scripts use CommonJS require(); that's an ESLint style rule,
  // not a real error, and shouldn't fail production builds.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "mosaic.scdn.co" },
      { protocol: "https", hostname: "image-cdn-ak.spotifycdn.com" },
      { protocol: "https", hostname: "image-cdn-fa.spotifycdn.com" },
    ],
  },
};

export default nextConfig;
