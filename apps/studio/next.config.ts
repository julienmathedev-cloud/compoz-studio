/**
 * @file apps/studio/next.config.ts
 * @description Next.js config (admin) — aliases monorepo + next-intl.
 */
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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

export default withNextIntl(nextConfig);
