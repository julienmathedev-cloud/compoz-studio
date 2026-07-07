/**
 * @file packages/validation/src/site/settings/menus/legal-menu/legal-menu.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing the legal menu settings boundary shape.
 *
 * @remarks
 * These schemas validate data shape only. Business rules and derived behavior,
 * such as external-link detection, are handled by the domain layer.
 */

import { MENU_ITEM, MENU_LABEL } from "@compoz/core/constants/limits/menu";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

export const LegalMenuItemSchema = z
  .object({
    id: z.string().trim().min(1, ERROR_CODES.LEGAL_MENU_ID_REQUIRED),

    label: z
      .string()
      .trim()
      .min(MENU_LABEL.MIN, ERROR_CODES.LEGAL_MENU_LABEL_REQUIRED)
      .max(MENU_LABEL.MAX, ERROR_CODES.LEGAL_MENU_LABEL_TOO_LONG),

    href: AssetUrlSchema,

    newTab: z.boolean(),
  })
  .strict();

export const LegalMenuSettingsSchema = z
  .object({
    items: z.array(LegalMenuItemSchema).max(MENU_ITEM.MAX, {
      message: ERROR_CODES.LEGAL_MENU_TOO_MANY_ITEMS,
    }),
  })
  .strict();

export type LegalMenuItemShape = z.infer<typeof LegalMenuItemSchema>;
export type LegalMenuSettingsShape = z.infer<typeof LegalMenuSettingsSchema>;
