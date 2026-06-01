/**
 * @file packages/core/src/domain/pages/entities/block.ts
 * @layer core/domain/pages
 * @description
 * Entités métier représentant les sections (blocks) qui composent une page.
 *
 * Invariants :
 * - un block représente une section de page,
 * - un block contient une liste ordonnée de rows,
 * - une row contient 1 à 3 colonnes,
 * - une colonne contient une liste ordonnée de cells,
 * - les options globales de layout/performance d’une section sont portées par le block.
 *
 * Ce fichier définit uniquement la forme canonique du modèle.
 */

import type { Cell } from "@compoz/core/domain/pages/entities/cell";

export type BlockId = string;
export type BlockRowId = string;
export type BlockColumnId = string;

/**
 * Type unique de block supporté en V0.9.
 *
 * Un block correspond à une section de page.
 */
export type BlockType = "section";

/**
 * Mode de container appliqué à la section.
 *
 * - `contained` : la section respecte le container global du site
 * - `fullBleed` : la section ignore le container global et peut s’étendre pleine largeur
 */
export type SectionBlockContainerMode = "contained" | "fullBleed";

/**
 * Breakpoints sur lesquels l’ordre visuel d’une row peut être inversé.
 *
 * @remarks
 * - `mobile` : petit viewport, empilement vertical prioritaire
 * - `tablet` : viewport intermédiaire
 * - `desktop` : viewport large
 */
export interface BlockRowReverseOn {
  /**
   * Inverse l’ordre visuel des colonnes sur mobile.
   */
  mobile: boolean;

  /**
   * Inverse l’ordre visuel des colonnes sur tablette.
   */
  tablet: boolean;

  /**
   * Inverse l’ordre visuel des colonnes sur desktop.
   */
  desktop: boolean;
}

/**
 * Row d'une section.
 *
 * Une row définit une ligne horizontale contenant
 * 1 à 3 colonnes.
 */
export interface BlockRow {
  /** Identifiant unique de la row. */
  id: BlockRowId;

  /** Nombre de colonnes dans la row. */
  columnsCount: 1 | 2 | 3;

  /**
   * Configuration responsive d’inversion d’ordre des colonnes.
   *
   * @remarks
   * - utile pour conserver un ordre de lecture naturel selon le viewport,
   * - l’intention est purement layout,
   * - les valeurs par défaut sont `false` sur tous les breakpoints.
   */
  reverseOn: BlockRowReverseOn;

  /**
   * Colonnes de la row.
   *
   * Invariant domaine :
   * `columns.length === columnsCount`
   */
  columns: ReadonlyArray<BlockColumn>;
}

/**
 * Colonne d'une row.
 *
 * Une colonne contient une liste verticale ordonnée de cells.
 */
export interface BlockColumn {
  /** Identifiant unique de la colonne. */
  id: BlockColumnId;

  /**
   * Cells de la colonne.
   *
   * L'ordre du tableau correspond à l'ordre vertical de rendu.
   */
  cells: ReadonlyArray<Cell>;
}

/**
 * Block "Section".
 *
 * Représente une section complète d'une page.
 */
export interface SectionBlock {
  /** Identifiant unique du block. */
  id: BlockId;

  /** Type discriminant. */
  type: "section";

  /**
   * Libellé interne persistant du block.
   */
  name: string;

  /**
   * Mode de container global de la section.
   *
   * Définit si la section respecte le container global du site
   * ou si elle doit s’étendre en pleine largeur.
   */
  containerMode: SectionBlockContainerMode;

  /**
   * Classe CSS additionnelle optionnelle appliquée au wrapper de section.
   */
  cssClassName?: string;

  /**
   * Indique si cette section doit être considérée prioritaire
   * pour l’optimisation du Largest Contentful Paint (LCP).
   *
   * Ce signal permet à la couche UI/rendu d’identifier le média
   * principal de la section à prioriser si nécessaire.
   */
  lcpPriority: boolean;

  /**
   * Rows composant la section.
   *
   * L'ordre du tableau correspond à l'ordre vertical
   * des rows dans la section.
   */
  rows: ReadonlyArray<BlockRow>;
}

/**
 * Union des blocks supportés.
 *
 * Pour la V0.9 un seul block existe.
 */
export type Block = SectionBlock;
