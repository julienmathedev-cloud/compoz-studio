/**
 * @file packages/validation/src/site/settings/social/social-form.ts
 * @layer schemas
 *
 * @description
 * Zod schemas describing the social settings UI form shape.
 *
 * @remarks
 * The form keeps `href` as a controlled string. It only applies minimal UX
 * checks for empty values and incomplete URL prefixes to keep field-level RHF
 * errors stable while editing.
 *
 * Canonical URL rules, such as kind-specific protocols, belong to the settings
 * boundary and domain layer.
 */

import { SOCIAL_ITEM } from "@compoz/core/constants/limits/social";
import { SOCIAL_KINDS } from "@compoz/core/constants/social/social-kinds";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  isHttpPrefixOnly,
  isMailtoPrefixOnly,
} from "@compoz/core/domain/urls/ui-heuristics";
import { z } from "zod";

export const SocialItemFormSchema = z
  .object({
    id: z.string().trim().min(1, ERROR_CODES.SOCIAL_ID_REQUIRED),
    kind: z.enum(SOCIAL_KINDS),
    href: z.string().trim(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const href = val.href.trim();
    const isPrefixOnly = isMailtoPrefixOnly(href) || isHttpPrefixOnly(href);

    if (href.length === 0 || isPrefixOnly) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.SOCIAL_HREF_REQUIRED,
      });
    }
  });

export const SocialFormSchema = z
  .object({
    items: z
      .array(SocialItemFormSchema)
      .max(SOCIAL_ITEM.MAX, ERROR_CODES.SOCIAL_TOO_MANY_ITEMS),
  })
  .strict()
  .superRefine((val, ctx) => {
    const firstIndexById = new Map<string, number>();
    const firstIndexByKind = new Map<string, number>();

    for (let i = 0; i < val.items.length; i++) {
      const id = String(val.items[i]?.id ?? "").trim();
      const kind = val.items[i]?.kind;

      if (id) {
        const firstIdxForId = firstIndexById.get(id);
        if (firstIdxForId == null) {
          firstIndexById.set(id, i);
        } else {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", i, "id"],
            message: ERROR_CODES.SOCIAL_DUPLICATE_ID,
          });
        }
      }

      if (!kind) continue;

      const firstIdxForKind = firstIndexByKind.get(kind);
      if (firstIdxForKind == null) {
        firstIndexByKind.set(kind, i);
        continue;
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items", i, "kind"],
        message: ERROR_CODES.SOCIAL_DUPLICATE_KIND,
      });
    }
  });

export type SocialItemFormValues = z.infer<typeof SocialItemFormSchema>;
export type SocialFormValues = z.infer<typeof SocialFormSchema>;
