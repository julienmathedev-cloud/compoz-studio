/**
 * @file packages/validation/src/site/settings/social/social-form.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme du formulaire Social côté UI (admin / RHF).
 *
 * @remarks
 * - Schéma UI (RHF-friendly) : `href` est une string contrôlée.
 * - On applique uniquement les règles UX minimales (requis + "préfixe seul")
 *   afin d’avoir des messages stables pendant la saisie.
 * - Les règles métier (mailto réservé à email, URL absolue requise, etc.)
 *   restent dans `social.ts` (settings/API) + domaine.
 */

import { SOCIAL } from "@compoz/core/constants/limits/social";

import { SOCIAL_KINDS } from "@compoz/core/constants/social/social-kinds";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  isHttpPrefixOnly,
  isMailtoPrefixOnly,
} from "@compoz/core/domain/urls/ui-heuristics";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                Item (UI)                                   */
/* -------------------------------------------------------------------------- */

export const SocialItemFormSchema = z
  .object({
    kind: z.enum(SOCIAL_KINDS),
    href: z.string().trim(),
  })
  .superRefine((val, ctx) => {
    const href = val.href.trim();

    // UX minimal : "" ou "préfixe seul" => requis (message stable)
    if (
      href.length === 0 ||
      isMailtoPrefixOnly(href) ||
      isHttpPrefixOnly(href)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: ERROR_CODES.SOCIAL_HREF_REQUIRED,
      });
    }
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                             Settings (UI)                                  */
/* -------------------------------------------------------------------------- */

export const SocialFormSchema = z
  .object({
    items: z
      .array(SocialItemFormSchema)
      .max(SOCIAL.ITEM_MAX, ERROR_CODES.SOCIAL_TOO_MANY_ITEMS),
  })
  .superRefine((val, ctx) => {
    const items = val.items ?? [];
    const firstIndexByKind = new Map<string, number>();

    for (let i = 0; i < items.length; i++) {
      const kind = items[i]?.kind;
      if (!kind) continue;

      const firstIdx = firstIndexByKind.get(kind);
      if (firstIdx == null) {
        firstIndexByKind.set(kind, i);
        continue;
      }

      // ✅ Doublon bloquant : erreur directement sur le champ `kind`
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items", i, "kind"],
        message: ERROR_CODES.SOCIAL_DUPLICATE_KIND,
      });
    }
  })
  .strict();

export type SocialItemFormValues = z.infer<typeof SocialItemFormSchema>;
export type SocialFormValues = z.infer<typeof SocialFormSchema>;
