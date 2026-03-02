/**
 * @file packages/core/src/domain/site/index/actions.ts
 * @layer core/domain
 * @description
 * Source de vérité des actions interprétées par le runner `updateSiteIndex`.
 * Ces actions décrivent **quoi faire**, sans porter la logique d’exécution.
 *
 * @remarks
 * - Actions immuables et purement descriptives.
 * - Utilisées pour modifier l’index du site (ordre des pages).
 * - Le moteur d’exécution est implémenté dans `updateSiteIndex.ts`.
 */

import type { PageSummary } from "@compoz/core/domain/pages/entities/page";
import type { PositionSpecifier } from "@compoz/core/domain/site/index/utils";

/** Identifiants stables des actions site-index. */
export const SITE_INDEX_ACTIONS = {
  ENSURE_PAGE_LISTED: "ensurePageListed",
  REMOVE_BY_ID: "removeById",
} as const;

export type SiteIndexActionType =
  (typeof SITE_INDEX_ACTIONS)[keyof typeof SITE_INDEX_ACTIONS];

/**
 * Action : garantir que `ref.id` est présent dans l’index.
 * - Si absent → insertion selon `position`.
 * - Si présent → mise à jour du slug/titre si besoin (et éventuellement repositionnement).
 */
export type EnsurePageListedAction = Readonly<{
  type: typeof SITE_INDEX_ACTIONS.ENSURE_PAGE_LISTED;

  /** Entrée page { id, slug, title } (source de vérité). */
  ref: Readonly<PageSummary>;

  /**
   * Position souhaitée :
   * - POS_APPEND / POS_PREPEND
   * - { beforeId } / { afterId }
   */
  position?: Readonly<PositionSpecifier>;
}>;

/**
 * Action : retirer la page `pageId` si elle existe.
 * Idempotent : aucune erreur si absente.
 */
export type RemoveByIdAction = Readonly<{
  type: typeof SITE_INDEX_ACTIONS.REMOVE_BY_ID;

  /** Id cible de l’entrée à retirer. */
  pageId: string;
}>;

/** Union des actions supportées par le runner updateSiteIndex. */
export type SiteIndexAction = EnsurePageListedAction | RemoveByIdAction;
