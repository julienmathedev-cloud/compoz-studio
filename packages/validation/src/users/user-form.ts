/**
 * @file packages/validation/src/users/user-form.ts
 * @layer schemas
 *
 * @description
 * Zod schema describing the Studio user UI form shape.
 *
 * @remarks
 * This schema is RHF-friendly and accepts draft values where needed. Email
 * uniqueness, complete RBAC rules, and other business invariants are handled
 * by the domain layer.
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";

const UserEmailFormSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_EMAIL_REQUIRED)
  .email(ERROR_CODES.USER_EMAIL_INVALID_FORMAT);

const UserNameFormSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_NAME_REQUIRED);

/**
 * Empty password means the existing password should remain unchanged.
 */
const UserPasswordFormSchema = z.string().superRefine((value, ctx) => {
  const password = String(value ?? "").trim();

  if (password.length === 0) {
    return;
  }

  if (password.length < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [],
      message: ERROR_CODES.USER_PASSWORD_REQUIRED,
    });
  }
});

const UserRoleFormSchema = z.enum(["admin", "editor"], {
  message: ERROR_CODES.USER_ROLE_INVALID,
});

const WebsiteIdsFormSchema = z
  .array(z.string().trim().min(1))
  .min(1, ERROR_CODES.USER_WEBSITE_IDS_REQUIRED);

const DefaultWebsiteIdFormSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_DEFAULT_WEBSITE_REQUIRED);

const UserRbacFormSchema = z
  .object({
    role: UserRoleFormSchema,
    websiteIds: WebsiteIdsFormSchema,
    defaultWebsiteId: DefaultWebsiteIdFormSchema,
  })
  .strict()
  .superRefine((rbac, ctx) => {
    const websiteIds = rbac.websiteIds
      .map((websiteId) => websiteId.trim())
      .filter(Boolean);

    const defaultWebsiteId = rbac.defaultWebsiteId.trim();
    const hasWildcard = websiteIds.includes("*");

    if (
      !hasWildcard &&
      defaultWebsiteId &&
      !websiteIds.includes(defaultWebsiteId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultWebsiteId"],
        message: ERROR_CODES.USER_DEFAULT_WEBSITE_NOT_ALLOWED,
      });
    }
  });

export const UserFormSchema = z
  .object({
    /**
     * Optional because the same form schema is used for creation and edition.
     */
    id: z.string().trim().min(1, ERROR_CODES.USER_ID_REQUIRED).optional(),

    email: UserEmailFormSchema,
    name: UserNameFormSchema,
    password: UserPasswordFormSchema,
    rbac: UserRbacFormSchema,
  })
  .strict();

export type UserFormValues = z.infer<typeof UserFormSchema>;
