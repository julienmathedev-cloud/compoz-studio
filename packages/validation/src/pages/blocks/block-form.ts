/**
 * @file packages/validation/src/pages/blocks/block-form.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme du formulaire UI d’édition d’un block
 * `LayoutSection`. Le schéma est volontairement minimal et orienté UX.
 */

import { z } from "zod";

import {
  LayoutSectionColumnsSchema,
  LayoutSectionContainerModeSchema,
  LayoutSectionTitleSchema,
} from "@compoz/validation/pages/blocks/block";
import { CellSchema } from "@compoz/validation/pages/blocks/cells/cell";

/* -------------------------------------------------------------------------- */
/*                                   Form                                     */
/* -------------------------------------------------------------------------- */

/**
 * Schéma du formulaire LayoutSectionBlock.
 *
 * - `columns` requis
 * - `cells` requis (longueur vérifiée côté domaine)
 * - `titleEnabled` pilote l’affichage du titre (UI + renderer)
 * - `title` est toujours présent pour pouvoir “nommer” le bloc même si désactivé
 * - `containerMode` requis
 */
export const LayoutSectionBlockFormSchema = z
  .object({
    columns: LayoutSectionColumnsSchema,
    containerMode: LayoutSectionContainerModeSchema,

    titleEnabled: z.boolean(),
    title: LayoutSectionTitleSchema,
    lcpPriority: z.boolean(),
    cells: z.array(CellSchema),
  })
  .strict();

export type LayoutSectionBlockFormValues = z.infer<
  typeof LayoutSectionBlockFormSchema
>;
