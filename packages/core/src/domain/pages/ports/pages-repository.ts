/**
 * @file src/core/domain/pages/ports/pages-repository.ts
 * @layer core/domain
 * @description
 * Port de persistance du domaine pour l’agrégat Page.
 * Définit le contrat d’accès aux pages, indépendant de tout transport (HTTP)
 * ou mécanisme de stockage (FS, DB, etc.).
 *
 * Choix V1 :
 * - ID = clé primaire (stable).
 * - Slug = identifiant lisible, unique, utilisé pour lookup et contraintes.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type {
  Page,
  PageSummary,
} from "@compoz/core/domain/pages/entities/page";

/**
 * Port de persistance pour l’agrégat "Page".
 * Les implémentations doivent être idempotentes autant que possible.
 */
export interface PagesRepository {
  /** Prépare le backend (création de dossiers, tables, etc.). Idempotent. */
  ensureBase(): Promise<void>;

  /* -------------------------------------------------------------------------- */
  /* Read                                                                        */
  /* -------------------------------------------------------------------------- */

  /**
   * Lit une page par son ID dans l’espace donné.
   * @returns La page ou `null` si absente.
   */
  readById(state: ContentState, pageId: string): Promise<Page | null>;

  /**
   * Lit une page par son slug dans l’espace donné (lookup).
   * @returns La page ou `null` si absente.
   */
  readBySlug(state: ContentState, slug: string): Promise<Page | null>;

  /* -------------------------------------------------------------------------- */
  /* Write                                                                       */
  /* -------------------------------------------------------------------------- */

  /**
   * Écrit (upsert) une page dans l’espace donné.
   * @remarks L’unicité du slug est gérée par les use-cases (via readBySlug/existsBySlug).
   */
  put(state: ContentState, page: Page): Promise<void>;

  /* -------------------------------------------------------------------------- */
  /* Delete                                                                      */
  /* -------------------------------------------------------------------------- */

  /**
   * Supprime une page par son ID (idempotent attendu).
   */
  deleteById(state: ContentState, pageId: string): Promise<void>;

  /* -------------------------------------------------------------------------- */
  /* Existence / contraintes                                                     */
  /* -------------------------------------------------------------------------- */

  /**
   * Indique si une page existe pour un ID donné.
   */
  existsById(state: ContentState, pageId: string): Promise<boolean>;

  /**
   * Indique si une page existe pour un slug donné.
   * Utile pour la création et pour valider l’unicité lors d’un changement de slug.
   */
  existsBySlug(state: ContentState, slug: string): Promise<boolean>;

  /* -------------------------------------------------------------------------- */
  /* Listing                                                                     */
  /* -------------------------------------------------------------------------- */

  /**
   * Liste des pages sous forme de résumés (id/slug/title).
   * Le tri est laissé à l’implémentation (FS/DB) mais doit être stable.
   */
  list(state: ContentState): Promise<ReadonlyArray<PageSummary>>;

  readManyById(
    state: ContentState,
    ids: ReadonlyArray<string>,
  ): Promise<Array<Page | null>>;

  /**
   * Écriture batch optimisée (KV/Redis -> MSET).
   * Permet de publier N pages en 1 seule opération réseau.
   */
  putMany(state: ContentState, pages: ReadonlyArray<Page>): Promise<void>;
}
