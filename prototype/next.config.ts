import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // PROTOTYPE ONLY. Real build serves from Cloudflare R2 per ADR-0001.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
