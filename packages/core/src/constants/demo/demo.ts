/**
 * @file packages/core/src/constants/demo/demo.ts
 * @layer core/constants/demo
 *
 * @description
 * Shared constants for the Compoz demo sandbox system.
 *
 * @remarks
 * - Centralizes V1 conventions used by demo bootstrap, auth, and sandbox cleanup.
 * - Contains no business logic by design.
 * /

/** Prisma Website.id used as the source seed when cloning a demo sandbox. */
export const DEMO_SEED_WEBSITE_ID = "demo" as const;

/** Cookie name used to bind a visitor to their demo sandbox instance. */
export const DEMO_INSTANCE_COOKIE_NAME = "compoz_demo_instance" as const;

/** Default V1 demo sandbox lifetime: 24 hours. */
export const DEMO_SANDBOX_TTL_MS = 24 * 60 * 60 * 1000;
