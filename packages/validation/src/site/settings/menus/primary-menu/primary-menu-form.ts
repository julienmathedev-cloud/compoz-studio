/**
 * @file packages/validation/src/site/settings/menus/primary-menu/primary-menu-form.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing the primary menu UI form shape.
 *
 * @remarks
 * The form keeps `href` as a controlled string. Required and URL-format checks
 * are handled in `superRefine` to keep field-level RHF errors predictable.
 *
 * Parent items with children may omit `href`, but cannot use `newTab`.
 * Item IDs must stay unique across parent and child levels.
 */

import { MENU_ITEM, MENU_LABEL } from "@compoz/core/constants/limits/menu";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { AssetUrlSchema } from "@compoz/validation/common/url-fragments";
import { z } from "zod";

const isValidAssetUrl = (href: string): boolean =>
  AssetUrlSchema.safeParse(href).success;

export const PrimaryMenuChildFormSchema = z
  .object({
    id: z.string().trim().min(1, ERROR_CODES.PRIMARY_MENU_ID_REQUIRED),
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

export const PrimaryMenuItemFormSchema = z
  .object({
    id: z.string().trim().min(1, ERROR_CODES.PRIMARY_MENU_ID_REQUIRED),
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

    if (hasChildren) {
      if (val.newTab !== false) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["newTab"],
          message:
            ERROR_CODES.PRIMARY_MENU_PARENT_WITH_CHILDREN_NEWTAB_FORBIDDEN,
        });
      }

      if (href.length > 0 && !isValidAssetUrl(href)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["href"],
          message: ERROR_CODES.PRIMARY_MENU_HREF_INVALID,
        });
      }

      return;
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

export const PrimaryMenuFormSchema = z
  .object({
    items: z.array(PrimaryMenuItemFormSchema).max(MENU_ITEM.MAX, {
      message: ERROR_CODES.PRIMARY_MENU_TOO_MANY_ITEMS,
    }),
  })
  .strict()
  .superRefine((val, ctx) => {
    const firstPathById = new Map<string, string>();

    for (let pIdx = 0; pIdx < val.items.length; pIdx++) {
      const parent = val.items[pIdx];
      const parentId = String(parent?.id ?? "").trim();

      if (parentId) {
        const currentPath = `items.${pIdx}.id`;
        const firstPath = firstPathById.get(parentId);

        if (firstPath == null) {
          firstPathById.set(parentId, currentPath);
        } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", pIdx, "id"],
            message: ERROR_CODES.PRIMARY_MENU_DUPLICATE_ID,
          });
        }
      }

      const children = parent?.children ?? [];

      for (let cIdx = 0; cIdx < children.length; cIdx++) {
        const childId = String(children[cIdx]?.id ?? "").trim();
        if (!childId) continue;

        const currentPath = `items.${pIdx}.children.${cIdx}.id`;
        const firstPath = firstPathById.get(childId);

        if (firstPath == null) {
          firstPathById.set(childId, currentPath);
        } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", pIdx, "children", cIdx, "id"],
            message: ERROR_CODES.PRIMARY_MENU_DUPLICATE_ID,
          });
        }
      }
    }
  });

export type PrimaryMenuFormValues = z.infer<typeof PrimaryMenuFormSchema>;
export type PrimaryMenuItemFormValues = z.infer<
  typeof PrimaryMenuItemFormSchema
>;
export type PrimaryMenuChildFormValues = z.infer<
  typeof PrimaryMenuChildFormSchema
>;
