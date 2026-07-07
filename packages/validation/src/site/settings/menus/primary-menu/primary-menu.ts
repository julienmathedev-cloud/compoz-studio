/**
 * @file packages/validation/src/site/settings/menus/primary-menu/primary-menu.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing the primary menu settings boundary shape.
 *
 * @remarks
 * This schema validates canonical settings payloads. Draft-friendly UI rules
 * belong to the form schema.
 *
 * Parent items with children may omit `href`, but cannot use `newTab`.
 * Leaf items must provide a valid `href`.
 */

import { MENU_ITEM, MENU_LABEL } from "@compoz/core/constants/limits/menu";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

export const PrimaryMenuChildSchema = z
  .object({
    id: z.string().trim().min(1, ERROR_CODES.PRIMARY_MENU_ID_REQUIRED),

    label: z
      .string()
      .trim()
      .min(MENU_LABEL.MIN, ERROR_CODES.PRIMARY_MENU_LABEL_REQUIRED)
      .max(MENU_LABEL.MAX, ERROR_CODES.PRIMARY_MENU_LABEL_TOO_LONG),

    href: AssetUrlSchema,

    newTab: z.boolean(),
  })
  .strict();

export const PrimaryMenuItemSchema = z
  .object({
    id: z.string().trim().min(1, ERROR_CODES.PRIMARY_MENU_ID_REQUIRED),

    label: z
      .string()
      .trim()
      .min(MENU_LABEL.MIN, ERROR_CODES.PRIMARY_MENU_LABEL_REQUIRED)
      .max(MENU_LABEL.MAX, ERROR_CODES.PRIMARY_MENU_LABEL_TOO_LONG),

    href: AssetUrlSchema.optional(),
    newTab: z.boolean(),
    children: z.array(PrimaryMenuChildSchema).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const hasChildren = Array.isArray(val.children) && val.children.length > 0;

    if (hasChildren && val.newTab !== false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newTab"],
        message: ERROR_CODES.PRIMARY_MENU_PARENT_WITH_CHILDREN_NEWTAB_FORBIDDEN,
      });
    }

    if (!hasChildren && typeof val.href !== "string") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.PRIMARY_MENU_HREF_REQUIRED,
      });
    }
  });

export const PrimaryMenuSettingsSchema = z
  .object({
    items: z.array(PrimaryMenuItemSchema).max(MENU_ITEM.MAX, {
      message: ERROR_CODES.PRIMARY_MENU_TOO_MANY_ITEMS,
    }),
  })
  .strict();

export type PrimaryMenuChildShape = z.infer<typeof PrimaryMenuChildSchema>;
export type PrimaryMenuItemShape = z.infer<typeof PrimaryMenuItemSchema>;
export type PrimaryMenuSettingsShape = z.infer<
  typeof PrimaryMenuSettingsSchema
>;
