/**
 * @file packages/validation/src/site/publish/publish-intents.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the site publication intent payload boundary.
 *
 * @remarks
 * This schema validates payload shape only. Publication rules and business
 * invariants are handled by the domain layer.
 */

import { ContentStateSchema } from "@compoz/validation/common/workflow-fragments";
import { z } from "zod";

export const PublishSiteIntentSchema = z
  .object({
    from: ContentStateSchema.optional(),
    to: ContentStateSchema.optional(),
    cleanOrphans: z.boolean().optional(),
  })
  .strict();

export type PublishSiteIntentDTO = z.infer<typeof PublishSiteIntentSchema>;
