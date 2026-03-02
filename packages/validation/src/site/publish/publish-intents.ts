/**
 * @file packages/validation/src/site/publish/publish-intents.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant la forme frontière de l’intention de publication du site.
 * Ce schéma valide uniquement la structure du payload ; les invariants métier
 * et règles de publication sont traités dans le domaine.
 */

import { ContentStateSchema } from "@compoz/validation/common/workflow-fragments";
import { z } from "zod";

/**
 * Intention de publication du site.
 * Contrat : paramètres optionnels de transition d’état, sans logique métier.
 */
export const PublishSiteIntentSchema = z
  .object({
    from: ContentStateSchema.optional(),
    to: ContentStateSchema.optional(),
    cleanOrphans: z.boolean().optional(),
  })
  .strict();

/**
 * DTO d’intention : résultat typé du parsing du payload de publication.
 */
export type PublishSiteIntentDTO = z.infer<typeof PublishSiteIntentSchema>;
