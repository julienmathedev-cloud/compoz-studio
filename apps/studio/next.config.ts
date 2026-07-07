/**
 * @file apps/studio/next.config.ts
 * @layer studio/config
 *
 * @description
 * Next.js configuration for the Studio app.
 *
 * @remarks
 * - Enables the Studio `next-intl` request plugin.
 * - Transpiles shared monorepo packages used by the app.
 * - Sets a 45-day minimum cache TTL for optimized remote images.
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
