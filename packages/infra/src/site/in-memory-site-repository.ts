/**
 * @file packages/infra/src/site/in-memory-site-repository.ts
 * @layer infra/site
 * @description
 * Implémentation InMemory du SiteRepository pour tests unitaires et e2e.
 *
 * Responsabilités : stockage en mémoire des SiteIndex et SiteSettings pour les espaces `draft` et `published`,
 * clonage structuré pour éviter les mutations externes, aucune I/O disque.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";

/**
 * Retourne un index vide daté de l’instant présent.
 * Contrat : utilisé comme fallback si l’index est absent.
 */
function defaultIndex(): SiteIndex {
  return {
    pages: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Retourne les settings complets avec tous les defaults du domaine.
 * Contrat : toutes les sous-sections sont présentes.
 */
function defaultSettings(): SiteSettings {
  return {
    header: { ...DEFAULT_HEADER_SETTINGS },
    footer: { ...DEFAULT_FOOTER_SETTINGS },
    primaryMenu: { ...DEFAULT_PRIMARY_MENU_SETTINGS },
    legalMenu: { ...DEFAULT_LEGAL_MENU_SETTINGS },
    identity: { ...DEFAULT_IDENTITY_SETTINGS },
    social: { ...DEFAULT_SOCIAL_SETTINGS },
    seo: { ...DEFAULT_SEO_SETTINGS },
  };
}

/**
 * Repository SiteRepository basé sur la mémoire.
 * Contrat : lit/écrit des copies pour isoler l’état interne, compatible tests unitaires et e2e.
 */
export class InMemorySiteRepository implements SiteRepository {
  // Stores mémoire séparés par espace de contenu (draft/published)
  private indexDraft: SiteIndex | null = null;
  private indexPublished: SiteIndex | null = null;
  private settingsDraft: SiteSettings | null = null;
  private settingsPublished: SiteSettings | null = null;

  /**
   * Initialise la base (no-op pour InMemory).
   */
  async ensureBase(): Promise<void> {
    // no-op
  }

  // ---------------------------------------------------------------------------
  // Helpers internes
  // ---------------------------------------------------------------------------

  /** Retourne l’index associé à un espace donné (ou `null` si absent). */
  private pickIndex(state: ContentState): SiteIndex | null {
    return state === CONTENT_STATE.PUBLISHED
      ? this.indexPublished
      : this.indexDraft;
  }

  /** Positionne l’index pour un espace donné. */
  private setIndex(state: ContentState, idx: SiteIndex): void {
    if (state === CONTENT_STATE.PUBLISHED) {
      this.indexPublished = idx;
    } else {
      this.indexDraft = idx;
    }
  }

  /** Retourne les settings associés à un espace donné (ou `null` si absents). */
  private pickSettings(state: ContentState): SiteSettings | null {
    return state === CONTENT_STATE.PUBLISHED
      ? this.settingsPublished
      : this.settingsDraft;
  }

  /** Positionne les settings pour un espace donné. */
  private setSettings(state: ContentState, s: SiteSettings): void {
    if (state === CONTENT_STATE.PUBLISHED) {
      this.settingsPublished = s;
    } else {
      this.settingsDraft = s;
    }
  }

  // ---------------------------------------------------------------------------
  // Méthodes du contrat `SiteRepository`
  // ---------------------------------------------------------------------------

  /**
   * Lit l’index pour un espace donné.
   * Contrat : fallback sur defaultIndex(), retourne une copie.
   */
  async readIndex(state: ContentState): Promise<SiteIndex> {
    return structuredClone(this.pickIndex(state) ?? defaultIndex());
  }

  /**
   * Écrit l’index pour un espace donné.
   * Contrat : stocke une copie pour isoler l’état interne.
   */
  async writeIndex(state: ContentState, index: SiteIndex): Promise<void> {
    this.setIndex(state, structuredClone(index));
  }

  /**
   * Lit les settings pour un espace donné.
   * Contrat : fallback sur defaultSettings(), retourne une copie.
   */
  async readSettings(state: ContentState): Promise<SiteSettings> {
    return structuredClone(this.pickSettings(state) ?? defaultSettings());
  }

  /**
   * Écrit les settings pour un espace donné.
   * Contrat : stocke une copie pour isoler l’état interne.
   */
  async writeSettings(
    state: ContentState,
    settings: SiteSettings,
  ): Promise<void> {
    this.setSettings(state, structuredClone(settings));
  }
}
