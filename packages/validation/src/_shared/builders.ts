/**
 * @file packages/validation/src/_shared/builders.ts
 * @layer schemas
 * @description
 * Helpers génériques pour construire des schémas Zod (strings, templates, intents).
 * Ces helpers sont purs et indépendants du domaine métier, et centralisent les
 * patterns récurrents de validation.
 */

import { ContentStateSchema } from "@compoz/validation/common/workflow-fragments";
import { z } from "zod";

/**
 * Chaîne trimée, non vide, avec bornes optionnelles.
 *
 * @param min - Longueur minimale (forcée à ≥ 1).
 * @param max - Longueur maximale optionnelle.
 * @returns Schéma Zod pour une string trimée non vide bornée.
 */
export function nonEmptyTrimmedString(min = 1, max?: number) {
  const effMin = Math.max(1, min);
  let s = z.string().trim().min(effMin, "Texte trop court.");
  if (typeof max === "number") s = s.max(max, "Texte trop long.");
  return s;
}

/**
 * Compose un schéma d’intentions API avec `state?: "draft" | "published"`.
 *
 * @param base - Schéma Zod de base (object) dont on veut dériver un intent.
 * @returns Schéma partiel strict avec `state?` ajouté.
 */
export function withOptionalState<
  TShape extends z.ZodRawShape,
  TBase extends z.ZodObject<TShape>,
>(base: TBase) {
  return base
    .partial()
    .extend({ state: ContentStateSchema.optional() })
    .strict();
}

/**
 * Type utilitaire : génère un type de patch à partir d’un type de base.
 *
 * @typeParam TBase - Type "plein" (shape complet d’un DTO/input).
 * @typeParam TOverrides - Overrides par clé (ex. clearables pour certains champs).
 */
export type PatchFromBase<
  TBase,
  TOverrides extends object = Record<never, never>,
> = {
  [K in keyof TBase]?: K extends keyof TOverrides ? TOverrides[K] : TBase[K];
};
