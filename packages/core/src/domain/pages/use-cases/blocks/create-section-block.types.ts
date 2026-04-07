/**
 * @file packages/core/src/domain/pages/use-cases/blocks/create-section-block.types.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description
 * Types du use-case de création d’un block `Section`.
 *
 * @remarks
 * - Définit uniquement le contrat.
 * - Aucune logique métier ici.
 */

import type {
  Block,
  BlockRowReverseOn,
  SectionBlock,
} from "@compoz/core/domain/pages/entities/block";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";

export interface CreateSectionBlockDeps {
  pages: PagesRepository;
  idGenerator: IdGenerator;
  nowIso?: () => string;
}

/**
 * Colonne fournie lors d’une création.
 *
 * @remarks
 * - `id` est optionnel : il sera généré par le domaine si absent.
 */
export type CreateSectionBlockColumnInput = {
  id?: string;
  cells: ReadonlyArray<Cell>;
};

/**
 * Ligne fournie lors d’une création.
 *
 * @remarks
 * - `id` est optionnel : il sera généré par le domaine si absent.
 * - Les ids des colonnes sont également optionnels.
 * - `reverseOn` est optionnel : une valeur par défaut sera injectée si absente.
 */
export type CreateSectionBlockRowInput = {
  id?: string;
  columnsCount: 1 | 2 | 3;
  reverseOn?: Partial<BlockRowReverseOn>;
  columns: ReadonlyArray<CreateSectionBlockColumnInput>;
};

/**
 * Entrée du use-case.
 *
 * @remarks
 * - `rows` est fourni par l’appelant (Studio / API).
 * - `insertAt` permet d’insérer le block à une position précise.
 * - `name` est le libellé interne persistant du block dans le Studio.
 * - Les ids imbriqués (`rows[].id`, `rows[].columns[].id`) peuvent être absents :
 *   ils seront générés côté domaine.
 */
export type CreateSectionBlockInput = {
  pageId: string;
  name?: string;
  containerMode: "contained" | "fullBleed";
  lcpPriority: boolean;
  rows: ReadonlyArray<CreateSectionBlockRowInput>;
  insertAt?: number;
};

/**
 * Entrée partielle utilisée hors contexte page (ex: adapter API).
 *
 * @remarks
 * - `pageId` reste la source de vérité de la route.
 * - L’adapter ne retourne que le payload “métier block”.
 */
export type CreateSectionBlockPatchInput = Omit<
  CreateSectionBlockInput,
  "pageId"
>;

export interface CreateSectionBlockResult {
  /** Page mise à jour. */
  page: Page;

  /** Block créé. */
  block: SectionBlock;

  /** Liste complète des blocks après insertion. */
  blocks: ReadonlyArray<Block>;
}
