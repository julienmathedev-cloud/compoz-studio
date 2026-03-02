/**
 * @file apps/site/next.config.ts
 * @description Next.js config file
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  transpilePackages: [
    "@compoz/core",
    "@compoz/ui",
    "@compoz/validation",
    "@compoz/http",
    "@compoz/infra",
  ],
};

export default nextConfig;
