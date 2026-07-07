/**
 * @file packages/validation/src/demo/demo-sandbox.ts
 * @layer validation/demo
 *
 * @description
 * Defines Zod schemas for demo sandbox boundary data.
 *
 * @remarks
 * These schemas validate stored and exposed data shape only; lifecycle rules stay in core.
 */

import { z } from "zod";

import { IsoDateStringSchema } from "@compoz/validation/common/date";

export const DemoInstanceIdSchema = z.string().trim().min(1);

export const DemoSandboxUserIdSchema = z.string().trim().min(1);

/** Website ids are normalized to lowercase to match persisted routing keys. */
export const DemoSandboxWebsiteIdSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => value.toLowerCase());

export const DemoSandboxSchema = z
  .object({
    demoInstanceId: DemoInstanceIdSchema,
    userId: DemoSandboxUserIdSchema,
    websiteId: DemoSandboxWebsiteIdSchema,
    expiresAt: IsoDateStringSchema,
    createdAt: IsoDateStringSchema,
  })
  .strict();

export type DemoSandboxShape = z.infer<typeof DemoSandboxSchema>;
export type DemoInstanceIdShape = z.infer<typeof DemoInstanceIdSchema>;
export type DemoSandboxUserIdShape = z.infer<typeof DemoSandboxUserIdSchema>;
export type DemoSandboxWebsiteIdShape = z.infer<
  typeof DemoSandboxWebsiteIdSchema
>;
