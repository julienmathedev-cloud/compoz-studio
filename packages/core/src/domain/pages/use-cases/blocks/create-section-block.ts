/**
 * @file packages/core/src/domain/pages/use-cases/blocks/create-section-block.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Use case that creates a section block on a draft page.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  BlockColumn,
  BlockRow,
  BlockRowReverseOn,
  SectionBlock,
} from "@compoz/core/domain/pages/entities/block";
import type {
  CreateSectionBlockDeps,
  CreateSectionBlockInput,
  CreateSectionBlockResult,
  CreateSectionBlockRowInput,
} from "@compoz/core/domain/pages/use-cases/blocks/create-section-block.types";
import {
  assertBlocks,
  assertInsertAt,
} from "@compoz/core/domain/pages/validators/blocks";
import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";

export function createSectionBlock({
  pages,
  idGenerator,
  nowIso = () => new Date().toISOString(),
}: CreateSectionBlockDeps) {
  return async function run(
    input: CreateSectionBlockInput,
  ): Promise<CreateSectionBlockResult> {
    const pageId = String(input.pageId ?? "").trim();

    if (!pageId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["pageId"] },
      });
    }

    if (
      input.containerMode !== "contained" &&
      input.containerMode !== "fullBleed"
    ) {
      throw new DomainError({
        code: EC.BLOCK_SECTION_CONTAINER_MODE_INVALID,
        message: EC.BLOCK_SECTION_CONTAINER_MODE_INVALID,
        details: { path: ["containerMode"] },
      });
    }

    if (!Array.isArray(input.rows)) {
      throw new DomainError({
        code: EC.BLOCK_ROWS_INVALID,
        message: EC.BLOCK_ROWS_INVALID,
        details: { path: ["rows"] },
      });
    }

    await pages.ensureBase();

    const page = await pages.readById(DEFAULT_CONTENT_STATE, pageId);

    if (!page) {
      throw new DomainError({
        code: EC.PAGE_NOT_FOUND,
        message: EC.PAGE_NOT_FOUND,
        details: {
          path: ["pageId"],
          meta: { pageId, state: DEFAULT_CONTENT_STATE },
        },
      });
    }

    const currentBlocks = Array.isArray(page.blocks) ? [...page.blocks] : [];
    const insertAt =
      typeof input.insertAt === "number"
        ? input.insertAt
        : currentBlocks.length;

    assertInsertAt({ insertAt, size: currentBlocks.length });

    const nextBlock: SectionBlock = {
      id: idGenerator.nextId(),
      type: "section",
      name: resolveBlockName(input.name, currentBlocks.length + 1),
      containerMode: input.containerMode,
      cssClassName: resolveCssClassName(input.cssClassName),
      lcpPriority: input.lcpPriority,
      rows: buildSectionRows(input.rows, idGenerator),
    };

    let nextBlocks = [...currentBlocks];

    /** Only one section can own LCP priority; creating a new priority block disables it on the others. */
    if (nextBlock.lcpPriority === true) {
      nextBlocks = nextBlocks.map((existingBlock) =>
        existingBlock.type === "section"
          ? { ...existingBlock, lcpPriority: false }
          : existingBlock,
      );
    }

    nextBlocks.splice(insertAt, 0, nextBlock);

    assertBlocks(nextBlocks);

    const nextPage = {
      ...page,
      blocks: nextBlocks,
      meta: {
        ...page.meta,
        updatedAt: nowIso(),
      },
    };

    await pages.put(DEFAULT_CONTENT_STATE, nextPage);

    return {
      page: nextPage,
      block: nextBlock,
      blocks: nextBlocks,
    };
  };
}

function ensureId(value: string | undefined, idGenerator: IdGenerator): string {
  const trimmed = String(value ?? "").trim();
  return trimmed || idGenerator.nextId();
}

function resolveBlockName(value: string | undefined, position: number): string {
  const trimmed = String(value ?? "").trim();
  return trimmed || `Bloc ${position}`;
}

function resolveCssClassName(value: string | undefined): string | undefined {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveRowReverseOn(
  value: Partial<BlockRowReverseOn> | undefined,
): BlockRowReverseOn {
  return {
    mobile: Boolean(value?.mobile),
    tablet: Boolean(value?.tablet),
    desktop: Boolean(value?.desktop),
  };
}

function buildSectionRows(
  rows: ReadonlyArray<CreateSectionBlockRowInput>,
  idGenerator: IdGenerator,
): BlockRow[] {
  return rows.map((row) => ({
    id: ensureId(row.id, idGenerator),
    columnsCount: row.columnsCount,
    reverseOn: resolveRowReverseOn(row.reverseOn),
    columns: buildSectionColumns(row.columns, idGenerator),
  }));
}

function buildSectionColumns(
  columns: ReadonlyArray<CreateSectionBlockRowInput["columns"][number]>,
  idGenerator: IdGenerator,
): BlockColumn[] {
  return columns.map((column) => ({
    id: ensureId(column.id, idGenerator),
    cells: [...column.cells],
  }));
}
