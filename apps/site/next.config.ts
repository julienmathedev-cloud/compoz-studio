/**
 * @file apps/site/next.config.ts
 * @description Next.js config file
 */
import type { NextConfig } from "next";

const SECONDS_PER_DAY = 60 * 60 * 24;
const CACHE_FOR_45_DAYS = SECONDS_PER_DAY * 45;

const nextConfig: NextConfig = {
  reactCompiler: false,

  /**
   * Force le rendu des metadata dynamiques dans le <head> initial.
   *
   * @remarks
   * Utile pour éviter les faux positifs Lighthouse SEO lorsque les metadata
   * générées via `generateMetadata()` sont streamées après le head initial.
   */
  htmlLimitedBots: /.*/,

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

export default nextConfig;
