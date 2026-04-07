/**
 * @file apps/studio/src/auth/demo-auth.ts
 * @layer studio/auth
 *
 * @description
 * Helpers serveur pour l'authentification automatique des sandboxes démo.
 *
 * @remarks
 * - Génère un password démo déterministe à partir du `demoInstanceId`
 *   et d'un secret serveur dédié.
 * - Permet de rejouer un vrai login Credentials sans stocker le mot de passe
 *   brut en base.
 * - Ces helpers sont destinés à être utilisés côté serveur uniquement.
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
 * Construit le mot de passe brut déterministe d'un user démo.
 *
 * @remarks
 * - Le résultat est stable pour un `demoInstanceId` donné tant que
 *   `DEMO_AUTH_SECRET` ne change pas.
 * - Le mot de passe retourné est destiné à être hashé/vérifié par le flow
 *   Credentials existant via le repository users.
 */
export function buildDemoUserPassword(demoInstanceId: string): string {
  const id = normalizeDemoInstanceId(demoInstanceId);

  if (!id) {
    throw new Error("buildDemoUserPassword: demoInstanceId is required.");
  }

  const secret = getDemoAuthSecret();

  return createHmac("sha256", secret).update(`compoz-demo:${id}`).digest("hex");
}
