import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /** أحجام أصغر من الافتراضي (حتى 3840px) لتسريع التحويل وتحميل الهيرو */
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
    ],
  },
  serverExternalPackages: ["@neondatabase/serverless"],
  experimental: {
    optimizePackageImports: ["next-auth", "next-auth/react"],
  },
  turbopack: {
    resolveAlias: {
      "next/auth": "next-auth",
      "next-auth/react": "next-auth/react",
    },
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/courses",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
