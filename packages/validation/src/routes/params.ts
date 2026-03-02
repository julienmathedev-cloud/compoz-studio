/**
 * @file packages/validation/src/routes/params.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière des paramètres dynamiques de routes.
 * Ces schémas valident uniquement la structure des paramètres HTTP ; les règles
 * métier associées sont traitées dans le domaine.
 */

import { BlockIdSchema } from "@compoz/validation/pages/blocks/block";
import { PageIdParamSchema } from "@compoz/validation/pages/page";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                Route params                                */
/* -------------------------------------------------------------------------- */

/**
 * Paramètres de route attendus pour une ressource block identifiée par un pageId et un blockId.
 */
export const PageIdAndBlockIdParamSchema = z
  .object({
    pageId: PageIdParamSchema.shape.pageId,
    blockId: BlockIdSchema,
  })
  .strict();

/** Type d’entrée brut correspondant à `PageIdAndBlockIdParamSchema`. */
export type PageIdAndBlockIdParam = z.input<typeof PageIdAndBlockIdParamSchema>;
