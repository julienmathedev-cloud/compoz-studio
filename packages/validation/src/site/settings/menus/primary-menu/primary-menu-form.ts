"use client";

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

import { MENU } from "@compoz/core/constants/limits/menu";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                  Child (UI)                                */
/* -------------------------------------------------------------------------- */

export const PrimaryMenuChildFormSchema = z
  .object({
    label: z
      .string()
      .trim()
      .max(MENU.LABEL_MAX, ERROR_CODES.PRIMARY_MENU_LABEL_TOO_LONG),
    href: z.string().trim(),
    newTab: z.boolean(),
  })
  .superRefine((val, ctx) => {
    const label = val.label.trim();
    if (label.length < MENU.LABEL_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["label"],
        message: ERROR_CODES.PRIMARY_MENU_LABEL_REQUIRED,
      });
    }

    const href = val.href.trim();
    if (href.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.PRIMARY_MENU_HREF_REQUIRED,
      });
      return;
    }

    const ok = AssetUrlSchema.safeParse(href).success;
    if (!ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.PRIMARY_MENU_HREF_INVALID,
      });
    }
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                               Parent/Leaf (UI)                              */
/* -------------------------------------------------------------------------- */

export const PrimaryMenuItemFormSchema = z
  .object({
    label: z
      .string()
      .trim()
      .max(MENU.LABEL_MAX, ERROR_CODES.PRIMARY_MENU_LABEL_TOO_LONG),
    href: z.string().trim(),
    newTab: z.boolean(),
    children: z.array(PrimaryMenuChildFormSchema).optional(),
  })
  .superRefine((val, ctx) => {
    const label = val.label.trim();
    if (label.length < MENU.LABEL_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["label"],
        message: ERROR_CODES.PRIMARY_MENU_LABEL_REQUIRED,
      });
    }

    const hasChildren = Array.isArray(val.children) && val.children.length > 0;

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
      const href = val.href.trim();
      if (href.length > 0) {
        const ok = AssetUrlSchema.safeParse(href).success;
        if (!ok) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["href"],
            message: ERROR_CODES.PRIMARY_MENU_HREF_INVALID,
          });
        }
      }

      return;
    }

    // Leaf : href requis + format
    const href = val.href.trim();
    if (href.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.PRIMARY_MENU_HREF_REQUIRED,
      });
      return;
    }

    const ok = AssetUrlSchema.safeParse(href).success;
    if (!ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.PRIMARY_MENU_HREF_INVALID,
      });
    }
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                  Settings (UI)                              */
/* -------------------------------------------------------------------------- */

export const PrimaryMenuFormSchema = z
  .object({
    items: z.array(PrimaryMenuItemFormSchema).max(MENU.ITEM_MAX, {
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
