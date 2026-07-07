/**
 * @file packages/validation/src/site/settings/menus/legal-menu/legal-menu-form.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing the legal menu UI form shape.
 *
 * @remarks
 * The form keeps `href` as a controlled string. Required and URL-format checks
 * are handled in `superRefine` to keep field-level RHF errors predictable.
 */

import { MENU_ITEM, MENU_LABEL } from "@compoz/core/constants/limits/menu";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

export const LegalMenuItemFormSchema = z
  .object({
    id: z.string().trim().min(1, ERROR_CODES.LEGAL_MENU_ID_REQUIRED),
    label: z
      .string()
      .trim()
      .max(MENU_LABEL.MAX, ERROR_CODES.LEGAL_MENU_LABEL_TOO_LONG),
    href: z.string().trim(),
    newTab: z.boolean(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const label = val.label.trim();
    const href = val.href.trim();

    if (label.length < MENU_LABEL.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["label"],
        message: ERROR_CODES.LEGAL_MENU_LABEL_REQUIRED,
      });
    }

    if (href.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.LEGAL_MENU_HREF_REQUIRED,
      });
      return;
    }

    if (!AssetUrlSchema.safeParse(href).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.LEGAL_MENU_HREF_INVALID,
      });
    }
  });

export const LegalMenuFormSchema = z
  .object({
    items: z.array(LegalMenuItemFormSchema).max(MENU_ITEM.MAX, {
      message: ERROR_CODES.LEGAL_MENU_TOO_MANY_ITEMS,
    }),
  })
  .strict()
  .superRefine((val, ctx) => {
    const firstIndexById = new Map<string, number>();

    for (let i = 0; i < val.items.length; i++) {
      const id = String(val.items[i]?.id ?? "").trim();
      if (!id) continue;

      const firstIdx = firstIndexById.get(id);
      if (firstIdx == null) {
        firstIndexById.set(id, i);
        continue;
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items", i, "id"],
        message: ERROR_CODES.LEGAL_MENU_DUPLICATE_ID,
      });
    }
  });

export type LegalMenuItemFormValues = z.infer<typeof LegalMenuItemFormSchema>;
export type LegalMenuFormValues = z.infer<typeof LegalMenuFormSchema>;
