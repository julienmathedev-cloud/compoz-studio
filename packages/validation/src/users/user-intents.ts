/**
 * @file packages/validation/src/users/user-intents.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing Studio user intent payload boundaries.
 *
 * @remarks
 * These schemas validate API and UI payload shapes only. Business invariants,
 * email uniqueness, and complete RBAC rules are handled by the domain layer.
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  UserEmailSchema,
  UserIdParamSchema,
  UserRoleSchema,
  WebsiteIdSchema,
  WebsiteIdsSchema,
} from "@compoz/validation/users/user";

export const UserNameSchema = z
  .string()
  .trim()
  .min(1, ERROR_CODES.USER_NAME_REQUIRED);

/**
 * Trims string input before enforcing a non-empty password boundary.
 */
export const UserPasswordSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().min(1, ERROR_CODES.USER_PASSWORD_REQUIRED),
);

export const UserRbacIntentSchema = z
  .object({
    role: UserRoleSchema,
    websiteIds: WebsiteIdsSchema,
    defaultWebsiteId: WebsiteIdSchema,
  })
  .strict();

export const CreateUserIntentSchema = z
  .object({
    email: UserEmailSchema,
    name: UserNameSchema,
    password: UserPasswordSchema,
    rbac: UserRbacIntentSchema,
  })
  .strict();

export type CreateUserIntentDTO = z.infer<typeof CreateUserIntentSchema>;

export const UpdateUserIntentSchema = z
  .object({
    email: UserEmailSchema.optional(),
    name: UserNameSchema.optional(),
    password: UserPasswordSchema.optional(),
    rbac: UserRbacIntentSchema.optional(),
  })
  .strict();

export type UpdateUserIntentDTO = z.infer<typeof UpdateUserIntentSchema>;

export const ListUsersIntentSchema = z.object({}).strict();
export type ListUsersIntentDTO = z.infer<typeof ListUsersIntentSchema>;

export { UserIdParamSchema };
