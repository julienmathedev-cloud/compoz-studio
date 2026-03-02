/**
 * @file src/core/domain/site/use-cases/publish/publish-site.types.ts
 * @layer core/domain
 * @description
 * Types du use-case `publishSite` : dépendances, entrée et résultat.
 * Définit le contrat **sans logique** (implémentation dans `publish-site.ts`).
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { PublishWarning } from "@compoz/core/domain/site/validators/publish";

/**
 * Hook de revalidation “infra”.
 *
 * @remarks
 * - Optionnel : en tests / dev simple, on peut ne pas le fournir.
 * - Ne doit contenir AUCUNE dépendance Next ici (domain only).
 */
export interface PublicRevalidator {
  /**
   * Invalide les pages publiques liées au published.
   *
   * @remarks
   * - `slugs` : slugs effectivement publiés (source-of-truth = index dérivé).
   * - Peut revalidatePath("/site") + revalidatePath("/site/<slug>") etc.
   */
  revalidatePublished(params: { slugs: ReadonlyArray<string> }): Promise<void>;
}

/** Dépendances injectées pour la publication du site. */
export interface PublishSiteDeps {
  /** Dépôt “site” (index + settings). */
  site: SiteRepository;
  /** Dépôt “pages” (CRUD pages). */
  pages: PagesRepository;
  /**
   * Revalidation côté infra (Next ISR) déclenchée après publish.
   * Optionnel pour éviter le couplage domain ↔ framework.
   */
  revalidator?: PublicRevalidator;
}

/**
 * Données d’entrée du use-case.
 * Toutes les propriétés sont optionnelles : les défauts sont appliqués
 * dans l’implémentation (`publishSite`).
 */
export interface PublishSiteInput {
  /** Espace source (draft par défaut). */
  from?: ContentState;

  /** Espace cible (published par défaut). */
  to?: ContentState;

  /**
   * Option de nettoyage des pages cibles orphelines (non listées dans l’index).
   * Actuellement non implémenté : ce flag est ignoré.
   */
  cleanOrphans?: boolean;
}

/** Résultat de la publication. */
export interface PublishSiteResult {
  /** Nombre de pages effectivement copiées dans l’espace cible. */
  pagesCopied: number;

  /** Indique si les settings du site (site.json) ont été copiés avec succès. */
  settingsCopied: boolean;

  /** Avertissements non bloquants (ex: pages manquantes, index vide…). */
  warnings: PublishWarning[];

  /** Rappel de l’espace source utilisé. */
  from: ContentState;

  /** Rappel de l’espace cible utilisé. */
  to: ContentState;
}
