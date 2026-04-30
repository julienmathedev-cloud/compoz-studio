/**
 * @file apps/site/next.config.ts
 * @description Next.js config file
 */
import type { NextConfig } from "next";

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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
