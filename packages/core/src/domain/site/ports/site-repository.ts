/**
 * @file packages/core/src/domain/site/ports/site-repository.ts
 * @layer core/domain
 * @description
 * Port de persistance de l’agrégat Site : index (ordre des pages) + réglages (settings).
 * Définit un contrat unique, indépendant de tout stockage (FS, DB, etc.).
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";

/**
 * Port de persistance pour l’agrégat Site.
 * Les méthodes doivent être idempotentes autant que possible.
 */
export interface SiteRepository {
  /**
   * Prépare le backend (création de dossiers/fichiers, tables…).
   * Doit être sans effet si déjà initialisé.
   */
  ensureBase(): Promise<void>;

  /** Lit l’index (ordre des pages) pour l’état donné. */
  readIndex(state: ContentState): Promise<Readonly<SiteIndex>>;

  /** Écrit/remplace l’index pour l’état donné. */
  writeIndex(state: ContentState, index: Readonly<SiteIndex>): Promise<void>;

  /** Lit les réglages du site (header, footer, menus, identité, SEO, social). */
  readSettings(state: ContentState): Promise<Readonly<SiteSettings>>;

  /** Écrit/remplace les réglages du site pour l’état donné. */
  writeSettings(
    state: ContentState,
    settings: Readonly<SiteSettings>,
  ): Promise<void>;
}
