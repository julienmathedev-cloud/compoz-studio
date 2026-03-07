/**
 * @file packages/core/src/domain/pages/entities/cell.ts
 * @layer core/domain/pages
 * @description
 * Entités métier représentant les cells contenues dans un block de page.
 *
 * Les cells sont des unités de contenu persistées au sein d’un block (V0.5 : LayoutSectionBlock).
 * - Pas de logique métier ici (voir use-cases).
 * - Pas de validation runtime ici (voir validators du domaine / schémas de validation).
 */

/**
 * Liste des types de cells supportés (union discriminée).
 */
export type CellKind = "richText" | "image" | "gallery" | "carousel";

/**
 * Cell "RichText".
 *
 * @remarks
 * - `content` peut être vide ; l’UI peut afficher un warning, mais ce n’est pas un invariant métier.
 */
export type RichTextCell = {
  kind: "richText";
  /** Contenu HTML (peut être vide). */
  content: string;
};

/**
 * Image manipulée dans l’éditeur (sous-structure réutilisée par plusieurs cells).
 */
export type ImageEditor = {
  /** Identifiant stable de l’image dans la cell. */
  id: string;
  /** Source de l’image (obligatoire). */
  src: string;
  /** Texte alternatif (peut être vide si décoratif). */
  alt: string;
  /** Légende optionnelle. */
  caption?: string;
  /** Lien optionnel (ex: image cliquable). */
  href?: string | null;
  /** Dimensions (px). */
  width: number;
  height: number;
};

export type ImageRatio = "default" | "wide" | "portrait" | "square";

/**
 * Cell "Image".
 */
export type ImageCell = {
  kind: "image";
  image: ImageEditor;
  /** Variante d’affichage (si non défini : ratio par défaut). */
  variant?: ImageRatio;
};

export type GalleryMaxColumns = 1 | 2 | 3 | 4 | 5;

/**
 * Cell "Gallery".
 */
export type GalleryCell = {
  kind: "gallery";
  linksEnabled: boolean;
  maxColumns: GalleryMaxColumns;
  images: ReadonlyArray<ImageEditor>;
};

/**
 * Cell "Carousel".
 */
export type CarouselCell = {
  kind: "carousel";
  images: ReadonlyArray<ImageEditor>;
};

export type Cell = RichTextCell | ImageCell | GalleryCell | CarouselCell;
