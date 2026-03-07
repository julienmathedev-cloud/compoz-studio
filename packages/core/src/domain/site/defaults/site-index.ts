/**
 * @file packages/core/src/domain/site/defaults/site-index.ts
 * @layer core/domain
 * @description
 * Valeurs par défaut **métier** pour l’index du site (`SiteIndex`).
 * Représente un état initial vierge de l’arborescence des pages.
 *
 * Invariant : index déclaratif uniquement (aucune logique).
 * `updatedAt` utilise un horodatage sentinelle pour indiquer “jamais mis à jour”.
 */

import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";

/** Horodatage sentinelle indiquant un index totalement vierge. */
export const EPOCH_ISO = "1970-01-01T00:00:00.000Z" as const;

/**
 * Valeur par défaut pour un index de site minimal.
 */
export const DEFAULT_SITE_INDEX: SiteIndex = {
  pages: [],
  updatedAt: EPOCH_ISO,
};
