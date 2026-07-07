/**
 * @file apps/studio/src/auth/demo-auth.ts
 * @layer studio/auth
 *
 * @description
 * Server helpers for automatic demo sandbox authentication.
 *
 * @remarks
 * - Generates a deterministic demo password from `demoInstanceId` and a
 *   dedicated server secret.
 * - Allows replaying a real Credentials login without storing the raw password
 *   in the database.
 * - These helpers are intended for server-side use only.
 */

import "server-only";

import { createHmac } from "node:crypto";

function getDemoAuthSecret(): string {
  const secret = String(process.env["DEMO_AUTH_SECRET"] ?? "").trim();

  if (!secret) {
    throw new Error("Missing DEMO_AUTH_SECRET.");
  }

  return secret;
}

function normalizeDemoInstanceId(value: unknown): string {
  return String(value ?? "").trim();
}

/**
 * Builds the deterministic raw password for a demo user.
 *
 * @remarks
 * - The result is stable for a given `demoInstanceId` as long as
 *   `DEMO_AUTH_SECRET` does not change.
 * - The returned password is intended to be hashed/verified by the existing
 *   Credentials flow through the users repository.
 */
export function buildDemoUserPassword(demoInstanceId: string): string {
  const id = normalizeDemoInstanceId(demoInstanceId);

  if (!id) {
    throw new Error("buildDemoUserPassword: demoInstanceId is required.");
  }

  const secret = getDemoAuthSecret();

  return createHmac("sha256", secret).update(`compoz-demo:${id}`).digest("hex");
}
