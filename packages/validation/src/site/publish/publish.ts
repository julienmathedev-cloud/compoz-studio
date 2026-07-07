/**
 * @file packages/validation/src/site/publish/publish.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing the site publication result boundary.
 *
 * @remarks
 * These schemas validate returned data shapes only. Publication rules and
 * business invariants are handled by the domain layer.
 */

import { ContentStateSchema } from "@compoz/validation/common/workflow-fragments";
import { z } from "zod";

export const PublishWarningSchema = z
  .object({
    /**
     * Kept as a free string to avoid coupling validation schemas to domain
     * warning codes.
     */
    code: z.string().trim().min(1),
    path: z.array(z.string().trim().min(1)).optional(),
    meta: z.unknown().optional(),
  })
  .strict();

export const PublishSiteResultSchema = z
  .object({
    pagesCopied: z.number().int().min(0),
    settingsCopied: z.boolean(),
    warnings: z.array(PublishWarningSchema),
    from: ContentStateSchema,
    to: ContentStateSchema,
  })
  .strict();

export type PublishSiteResultDTO = z.infer<typeof PublishSiteResultSchema>;
