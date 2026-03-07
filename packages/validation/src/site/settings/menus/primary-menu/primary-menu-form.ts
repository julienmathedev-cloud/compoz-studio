/**
 * @file packages/validation/src/site/settings/menus/primary-menu/primary-menu-form.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme du formulaire d’édition du menu principal.
 *
 * @remarks
 * - Schéma UI (RHF-friendly) : `href` est une string contrôlée.
 * - Les règles "requis" et "format URL" sont appliquées en `superRefine`
 *   pour accepter les valeurs draft (`""`) pendant la saisie.
 * - Un parent avec enfants :
 *   - `newTab` interdit
 *   - `href` optionnel (peut être "")
 */

import { MENU_ITEM, MENU_LABEL } from "@compoz/core/constants/limits/menu";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                  Child (UI)                                */
/* -------------------------------------------------------------------------- */

const isValidAssetUrl = (href: string): boolean =>
  AssetUrlSchema.safeParse(href).success;

export const PrimaryMenuChildFormSchema = z
  .object({
    label: z
      .string()
      .trim()
      .max(MENU_LABEL.MAX, ERROR_CODES.PRIMARY_MENU_LABEL_TOO_LONG),
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
        message: ERROR_CODES.PRIMARY_MENU_LABEL_REQUIRED,
      });
    }

    if (href.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.PRIMARY_MENU_HREF_REQUIRED,
      });
      return;
    }

    if (!isValidAssetUrl(href)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.PRIMARY_MENU_HREF_INVALID,
      });
    }
  });

/* -------------------------------------------------------------------------- */
/*                               Parent/Leaf (UI)                             */
/* -------------------------------------------------------------------------- */

export const PrimaryMenuItemFormSchema = z
  .object({
    label: z
      .string()
      .trim()
      .max(MENU_LABEL.MAX, ERROR_CODES.PRIMARY_MENU_LABEL_TOO_LONG),
    href: z.string().trim(),
    newTab: z.boolean(),
    children: z.array(PrimaryMenuChildFormSchema).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const label = val.label.trim();
    const href = val.href.trim();
    const hasChildren = Array.isArray(val.children) && val.children.length > 0;

    if (label.length < MENU_LABEL.MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["label"],
        message: ERROR_CODES.PRIMARY_MENU_LABEL_REQUIRED,
      });
    }

    // Parent (avec children)
    if (hasChildren) {
      if (val.newTab !== false) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newTab"],
          message:
            ERROR_CODES.PRIMARY_MENU_PARENT_WITH_CHILDREN_NEWTAB_FORBIDDEN,
        });
      }

      // href optionnel : si présent, il doit être valide.
      if (href.length > 0 && !isValidAssetUrl(href)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["href"],
          message: ERROR_CODES.PRIMARY_MENU_HREF_INVALID,
        });
      }

      return;
    }

    // Leaf : href requis + format
    if (href.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.PRIMARY_MENU_HREF_REQUIRED,
      });
      return;
    }

    if (!isValidAssetUrl(href)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.PRIMARY_MENU_HREF_INVALID,
      });
    }
  });

/* -------------------------------------------------------------------------- */
/*                                  Settings (UI)                              */
/* -------------------------------------------------------------------------- */

export const PrimaryMenuFormSchema = z
  .object({
    items: z.array(PrimaryMenuItemFormSchema).max(MENU_ITEM.MAX, {
      message: ERROR_CODES.PRIMARY_MENU_TOO_MANY_ITEMS,
    }),
  })
  .strict();

export type PrimaryMenuFormValues = z.infer<typeof PrimaryMenuFormSchema>;
export type PrimaryMenuItemFormValues = z.infer<
  typeof PrimaryMenuItemFormSchema
>;
export type PrimaryMenuChildFormValues = z.infer<
  typeof PrimaryMenuChildFormSchema
>;
