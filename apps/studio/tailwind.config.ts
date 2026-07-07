/**
 * @file apps/studio/tailwind.config.ts
 * @layer studio/config
 *
 * @description
 * Tailwind CSS configuration for the Studio app.
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
