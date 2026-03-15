/**
 * @file packages/core/src/domain/site/entities/site-status-details.ts
 * @layer core/domain
 * @description
 * DTOs exposés pour les statuts du site.
 */

/* -------------------------------------------------------------------------------------------------
 * Lazy-load details (Overview table)
 * ------------------------------------------------------------------------------------------------- */

/** Scope de chargement des détails (lazy). */
export type SiteStatusDetailsScope = "dirty" | "all";

/** Query DTO pour les détails. */
export type SiteStatusDetailsQuery = Readonly<{
  scope?: SiteStatusDetailsScope;
  includeBlocks?: boolean;
  pageId?: string | null;
}>;

/** Type de changement comparé draft vs published (read-model). */
export type SiteDiffKind = "published" | "new" | "modified" | "deleted";

/** Bloc (read-model) pour l’Overview details. */
export type SiteStatusBlockDetails = Readonly<{
  id: string;
  /** Optionnel mais utile en UI : type de bloc (layoutSection, richText, image, etc.) */
  type?: string;
  /** Label court si tu l’as (sinon tu peux le laisser vide côté API). */
  name?: string;
  diff: SiteDiffKind;
}>;

/** Page (read-model) pour l’Overview details. */
export type SiteStatusPageDetails = Readonly<{
  id: string;
  slug: string;
  name: string;
  diff: SiteDiffKind;

  /**
   * Compteurs “rapides” pour afficher un résumé sans tout dérouler.
   * (facultatif mais pratique pour une table)
   */
  blocks: Readonly<{
    draft: number;
    published: number;
    modified: number;
    new: number;
    deleted: number;
  }>;

  /** En V0.5 on peut renvoyer la liste directement (sinon on fera un 2e lazy plus tard). */
  blockItems?: ReadonlyArray<SiteStatusBlockDetails>;
}>;

/** DTO lazy chargé uniquement quand l’utilisateur ouvre la table. */
export type SiteStatusDetails = Readonly<{
  scope: SiteStatusDetailsScope;
  includeBlocks: boolean;
  pages: ReadonlyArray<SiteStatusPageDetails>;
}>;
