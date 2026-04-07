/**
 * @file packages/validation/src/demo/demo-sandbox.ts
 * @layer schemas
 * @description
 * Schémas Zod décrivant la forme frontière d’une sandbox démo.
 *
 * @remarks
 * - Ces schémas valident la structure stockée/exposée.
 * - Les règles métier globales restent traitées dans le domaine.
 */

import { z } from "zod";

import { IsoDateStringSchema } from "@compoz/validation/common/date";

/* -------------------------------------------------------------------------- */
/*                               Schémas atomiques                            */
/* -------------------------------------------------------------------------- */

/**
 * Identifiant technique unique d’une sandbox démo.
 *
 * Contrat :
 * - trim
 * - non vide
 */
export const DemoInstanceIdSchema = z.string().trim().min(1);

/**
 * Identifiant technique du user démo associé.
 *
 * Contrat :
 * - trim
 * - non vide
 */
export const DemoSandboxUserIdSchema = z.string().trim().min(1);

/**
 * Identifiant technique du tenant sandbox associé.
 *
 * Contrat :
 * - trim
 * - lower-case
 * - non vide
 */
export const DemoSandboxTenantIdSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.toLowerCase());

/* -------------------------------------------------------------------------- */
/*                               Sandbox démo                                 */
/* -------------------------------------------------------------------------- */

export const DemoSandboxSchema = z
  .object({
    demoInstanceId: DemoInstanceIdSchema,
    userId: DemoSandboxUserIdSchema,
    tenantId: DemoSandboxTenantIdSchema,
    expiresAt: IsoDateStringSchema,
    createdAt: IsoDateStringSchema,
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DemoSandboxShape = z.infer<typeof DemoSandboxSchema>;
export type DemoInstanceIdShape = z.infer<typeof DemoInstanceIdSchema>;
export type DemoSandboxUserIdShape = z.infer<typeof DemoSandboxUserIdSchema>;
export type DemoSandboxTenantIdShape = z.infer<
  typeof DemoSandboxTenantIdSchema
>;
