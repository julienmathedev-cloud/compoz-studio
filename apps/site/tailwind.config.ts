/**
 * @file apps/site/tailwind.config.ts
 * @layer site/config
 *
 * @description
 * Tailwind CSS configuration for the public Site app.
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    "../../packages/core/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
