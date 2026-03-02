/**
 * @file packages/validation/src/site/publish/publish.ts
 * @layer schemas
 * @description
 * Définit le schéma Zod décrivant le résultat de la publication du site.
 * Ce schéma valide uniquement la structure des données renvoyées ; les invariants
 * métier et règles de publication sont traités dans le domaine.
 */

import { ContentStateSchema } from "@compoz/validation/common/workflow-fragments";
import { z } from "zod";

/** Avertissement non bloquant renvoyé par la publication. */
export const PublishWarningSchema = z
  .object({
    /** Code stable (string libre ici pour ne pas lier les schémas au domaine). */
    code: z.string().trim().min(1),
    /** Chemin optionnel (ex: ["pages", "home"]). */
    path: z.array(z.string().trim().min(1)).optional(),
    /** Métadonnées éventuelles (structure libre). */
    meta: z.unknown().optional(),
  })
  .strict();

/** Résultat de l’opération de publication. */
export const PublishSiteResultSchema = z
  .object({
    /** Nombre de pages copiées pendant la publication (entier ≥ 0). */
    pagesCopied: z.number().int().min(0),
    /** Indique si les réglages du site ont été copiés. */
    settingsCopied: z.boolean(),
    /** Liste d’avertissements non bloquants. */
    warnings: z.array(PublishWarningSchema),
    /** Espace logique source (ex. "draft"). */
    from: ContentStateSchema,
    /** Espace logique cible (ex. "published"). */
    to: ContentStateSchema,
  })
  .strict();

/** DTO de réponse pour la publication. */
export type PublishSiteResultDTO = z.infer<typeof PublishSiteResultSchema>;
