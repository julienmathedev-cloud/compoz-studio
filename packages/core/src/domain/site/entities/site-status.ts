/**
 * @file packages/core/src/domain/site/entities/site-status.ts
 * @layer core/domain
 * @description
 * DTO transporté entre l’API admin et le client : état global draft vs published.
 *
 * @remarks
 * - DTO “read model” (compteurs + indicateurs) : pas une entity, pas une shape RHF.
 * - V0.5 : calculé côté serveur (FS), consommé côté client (Overview).
 */

import type { PublishWarning } from "@compoz/core/domain/site/validators/publish";

export type SiteStatus = Readonly<{
  published: Readonly<{
    exists: boolean;
    /** Timestamp ISO (basé sur l’index published) */
    lastPublishedAt?: string;
  }>;

  hasChanges: Readonly<{
    site: boolean;
    settings: boolean;
    pages: boolean;
  }>;

  counts: Readonly<{
    pages: Readonly<{
      draft: number;
      published: number;
      modified: number;
      new: number;
      deleted: number;
    }>;
    blocks: Readonly<{
      draft: number;
      published: number;
      modified: number;
      new: number;
      deleted: number;
    }>;
  }>;

  /**
   * Détail “dirty” par sous-réglage (V0.5).
   * Sert à l’Overview pour afficher un badge par section.
   */
  changedSettings: Readonly<{
    identity: boolean;
    primaryMenu: boolean;
    legalMenu: boolean;
    social: boolean;
    header: boolean;
    footer: boolean;
    seo: boolean;
  }>;

  /** Warnings non bloquants visibles avant publication */
  prePublishWarnings?: ReadonlyArray<PublishWarning>;
}>;
