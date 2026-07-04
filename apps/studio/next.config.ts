/**
 * @file apps/studio/next.config.ts
 * @description Next.js config (admin) — aliases monorepo + next-intl.
 */
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const SECONDS_PER_DAY = 60 * 60 * 24;
const CACHE_FOR_45_DAYS = SECONDS_PER_DAY * 45;

const nextConfig: NextConfig = {
  reactCompiler: false,

  transpilePackages: [
    "@compoz/core",
    "@compoz/ui",
    "@compoz/validation",
    "@compoz/http",
    "@compoz/infra",
  ],

  images: {
    minimumCacheTTL: CACHE_FOR_45_DAYS,
    deviceSizes: [640, 1024, 1536, 1920],
    imageSizes: [128, 256, 384, 512],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
