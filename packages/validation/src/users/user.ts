/**
 * @file packages/validation/src/users/user.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing the Studio user boundary shape.
 *
 * @remarks
 * These schemas validate API and infrastructure payload shapes only. Business
 * invariants and global consistency rules are handled by the domain layer.
 *
 * Technical IDs intentionally remain non-empty strings so storage
 * implementations can evolve without changing the validation boundary.
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { IsoDateStringSchema } from "@compoz/validation/common/date";

export const UserIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_ID_REQUIRED);

/**
 * Email is normalized at the boundary to avoid case-sensitive user identities.
 */
export const UserEmailSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_EMAIL_REQUIRED)
  .email(ERROR_CODES.USER_EMAIL_INVALID_FORMAT)
  .transform((value) => value.toLowerCase());

export const UserNameSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_NAME_REQUIRED);

export const UserRoleSchema = z.enum(["admin", "editor"], {
  message: ERROR_CODES.USER_ROLE_INVALID,
});

export const UserStatusSchema = z.enum(["active", "disabled"], {
  message: ERROR_CODES.USER_STATUS_INVALID,
});

/**
 * Website IDs are normalized at the boundary and cannot use the wildcard value.
 */
export const WebsiteIdSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_WEBSITE_IDS_REQUIRED)
  .transform((value) => value.toLowerCase())
  .refine((value) => value !== "*", ERROR_CODES.USER_WEBSITE_IDS_INVALID);

export const WebsiteIdsSchema = z
  .array(WebsiteIdSchema)
  .min(1, ERROR_CODES.USER_WEBSITE_IDS_REQUIRED)
  .superRefine((websiteIds, ctx) => {
    const seen = new Set<string>();

    for (let index = 0; index < websiteIds.length; index++) {
      const websiteId = websiteIds[index];

      if (seen.has(websiteId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: ERROR_CODES.USER_WEBSITE_IDS_INVALID,
        });
        return;
      }

      seen.add(websiteId);
    }
  });

export const DemoInstanceIdSchema = z.string().trim().min(1);

export const UserRbacSchema = z
  .object({
    role: UserRoleSchema,
    websiteIds: WebsiteIdsSchema,
    defaultWebsiteId: WebsiteIdSchema,
  })
  .strict()
  .superRefine((rbac, ctx) => {
    if (!rbac.websiteIds.includes(rbac.defaultWebsiteId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: ERROR_CODES.USER_DEFAULT_WEBSITE_NOT_ALLOWED,
        path: ["defaultWebsiteId"],
      });
    }
  });

export const UserMetaSchema = z
  .object({
    createdAt: IsoDateStringSchema,
    updatedAt: IsoDateStringSchema,
    lastLoginAt: IsoDateStringSchema.optional(),
  })
  .strict();

export const UserDemoMetaSchema = z
  .object({
    isDemo: z.boolean(),
    demoInstanceId: DemoInstanceIdSchema,
    expiresAt: IsoDateStringSchema,
  })
  .strict();

export const UserIdParamSchema = z.object({ userId: UserIdSchema }).strict();

export const UserSchema = z
  .object({
    id: UserIdSchema,
    email: UserEmailSchema,
    name: UserNameSchema,
    status: UserStatusSchema,
    rbac: UserRbacSchema,
    meta: UserMetaSchema,
    demo: UserDemoMetaSchema.optional(),
  })
  .strict();

export const UserSummarySchema = z
  .object({
    id: UserIdSchema,
    email: UserEmailSchema,
    name: UserNameSchema,
    status: UserStatusSchema,
  })
  .strict();

export type UserShape = z.infer<typeof UserSchema>;
export type UserSummaryShape = z.infer<typeof UserSummarySchema>;
export type UserRbacShape = z.infer<typeof UserRbacSchema>;
export type UserRoleShape = z.infer<typeof UserRoleSchema>;
export type UserStatusShape = z.infer<typeof UserStatusSchema>;
export type UserIdShape = z.infer<typeof UserIdSchema>;
export type UserIdParamShape = z.infer<typeof UserIdParamSchema>;
export type WebsiteIdShape = z.infer<typeof WebsiteIdSchema>;
export type WebsiteIdsShape = z.infer<typeof WebsiteIdsSchema>;
export type DemoInstanceIdShape = z.infer<typeof DemoInstanceIdSchema>;
export type UserDemoMetaShape = z.infer<typeof UserDemoMetaSchema>;
