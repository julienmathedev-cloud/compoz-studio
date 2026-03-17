/**
 * @file packages/validation/src/pages/page-form.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme du formulaire UI de création / édition d’une page.
 * Réutilise les règles frontière existantes et reste UI-first (RHF).
 */

import { z } from "zod";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  PageIdSchema,
  PageNameSchema,
  PageSeoTitleSchema,
  SitemapChangeFreqSchema,
  SlugSchema,
} from "@compoz/validation/pages/page";

/* -------------------------------------------------------------------------- */
/*                                   Champs                                   */
/* -------------------------------------------------------------------------- */

/**
 * Slug UI (draft-friendly).
 * - "" autorisé pendant la saisie
 * - si non vide : doit respecter `SlugSchema` (format final + non réservé)
 */
const PageSlugFormSchema = z
  .string()
  .trim()
  .superRefine((val, ctx) => {
    const v = val.trim();
    if (v.length === 0) return; // draft accepté (requis géré par l’UI si besoin)

    // Cas spécial UI : page d’accueil
    if (v === "/") return;

    const parsed = SlugSchema.safeParse(v);
    if (!parsed.success) {
      const firstMessage =
        parsed.error.issues[0]?.message ?? ERROR_CODES.PAGE_SLUG_INVALID_FORMAT;

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: firstMessage,
      });
    }
  });

/**
 * Bloc sitemap UI (optionnel).
 * - `include` pilote l’activation.
 * - `changefreq` reste optionnel : defaults côté domaine.
 * - `priority` est optionnelle et peut être `null` pour “reset” côté UI.
 */
const PageSitemapFormSchema = z
  .object({
    include: z.boolean(),
    changefreq: SitemapChangeFreqSchema.nullable().optional(),
    priority: z
      .union([
        z
          .number()
          .min(0, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE)
          .max(1, ERROR_CODES.PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE),
        z.null(),
      ])
      .optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/*                                   Schema                                   */
/* -------------------------------------------------------------------------- */

export const PageFormSchema = z
  .object({
    name: PageNameSchema,
    seoTitle: PageSeoTitleSchema.optional(),
    parentId: PageIdSchema.nullable(),
    slug: PageSlugFormSchema,
    sitemap: PageSitemapFormSchema.optional(),
    paginationEnabled: z.boolean(),
  })
  .strict();

export type PageFormValues = z.infer<typeof PageFormSchema>;
