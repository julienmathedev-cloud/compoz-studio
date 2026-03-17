/**
 * @file packages/core/src/domain/pages/validators/blocks.ts
 * @layer core/domain/pages/validators
 * @description
 * Invariants métier bloquants applicables aux blocks d’une page (V0.9).
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

import type {
  Block,
  BlockColumn,
  BlockRow,
} from "@compoz/core/domain/pages/entities/block";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";

import {
  assertCell,
  validateUniqueHeadingH1,
} from "@compoz/core/domain/pages/validators/cells";

type Path = ReadonlyArray<string | number>;

export function assertBlocks(blocks: ReadonlyArray<Block>): void {
  if (!Array.isArray(blocks)) {
    throw new DomainError({
      code: EC.BLOCKS_INVALID,
      message: EC.BLOCKS_INVALID,
      details: { path: ["blocks"] },
    });
  }

  const seenIds = new Set<string>();
  let lcpCount = 0;
  const pageCells: Cell[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    const id = block.id?.trim?.() ?? "";

    if (!id) {
      throw new DomainError({
        code: EC.BLOCK_ID_REQUIRED,
        message: EC.BLOCK_ID_REQUIRED,
        details: { path: ["blocks", i, "id"] },
      });
    }

    if (seenIds.has(id)) {
      throw new DomainError({
        code: EC.BLOCK_ID_DUPLICATE,
        message: EC.BLOCK_ID_DUPLICATE,
        details: { path: ["blocks", i, "id"], meta: { id } },
      });
    }

    seenIds.add(id);

    if (block.type !== "section") {
      throw new DomainError({
        code: EC.BLOCK_TYPE_UNSUPPORTED,
        message: EC.BLOCK_TYPE_UNSUPPORTED,
        details: {
          path: ["blocks", i, "type"],
          meta: { type: (block as { type?: unknown }).type },
        },
      });
    }

    const name = block.name?.trim?.() ?? "";

    if (!name) {
      throw new DomainError({
        code: EC.BLOCK_NAME_REQUIRED,
        message: EC.BLOCK_NAME_REQUIRED,
        details: { path: ["blocks", i, "name"] },
      });
    }

    if (block.lcpPriority === true) {
      lcpCount++;

      if (lcpCount > 1) {
        throw new DomainError({
          code: EC.BLOCKS_MULTIPLE_LCP_DETECTED,
          message: EC.BLOCKS_MULTIPLE_LCP_DETECTED,
          details: { path: ["blocks"], meta: { lcpCount } },
        });
      }
    }

    if (
      block.containerMode !== "contained" &&
      block.containerMode !== "fullBleed"
    ) {
      throw new DomainError({
        code: EC.BLOCK_SECTION_CONTAINER_MODE_INVALID,
        message: EC.BLOCK_SECTION_CONTAINER_MODE_INVALID,
        details: { path: ["blocks", i, "containerMode"] },
      });
    }

    if (!Array.isArray(block.rows)) {
      throw new DomainError({
        code: EC.BLOCK_ROWS_INVALID,
        message: EC.BLOCK_ROWS_INVALID,
        details: { path: ["blocks", i, "rows"] },
      });
    }

    assertRows(block.rows, ["blocks", i, "rows"], pageCells);
  }

  validateUniqueHeadingH1(pageCells, ["blocks"]);
}

function assertRows(
  rows: ReadonlyArray<BlockRow>,
  path: Path,
  pageCells: Cell[],
) {
  const seenIds = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowPath = [...path, i];

    const id = row.id?.trim?.() ?? "";

    if (!id) {
      throw new DomainError({
        code: EC.BLOCK_ROW_ID_REQUIRED,
        message: EC.BLOCK_ROW_ID_REQUIRED,
        details: { path: [...rowPath, "id"] },
      });
    }

    if (seenIds.has(id)) {
      throw new DomainError({
        code: EC.BLOCK_ROW_ID_DUPLICATE,
        message: EC.BLOCK_ROW_ID_DUPLICATE,
        details: { path: [...rowPath, "id"], meta: { id } },
      });
    }

    seenIds.add(id);

    if (![1, 2, 3].includes(row.columnsCount)) {
      throw new DomainError({
        code: EC.BLOCK_SECTION_COLUMNS_INVALID,
        message: EC.BLOCK_SECTION_COLUMNS_INVALID,
        details: { path: [...rowPath, "columnsCount"] },
      });
    }

    if (!Array.isArray(row.columns)) {
      throw new DomainError({
        code: EC.BLOCK_COLUMNS_INVALID,
        message: EC.BLOCK_COLUMNS_INVALID,
        details: { path: [...rowPath, "columns"] },
      });
    }

    if (row.columns.length !== row.columnsCount) {
      throw new DomainError({
        code: EC.BLOCK_COLUMNS_COUNT_MISMATCH,
        message: EC.BLOCK_COLUMNS_COUNT_MISMATCH,
        details: {
          path: [...rowPath, "columns"],
          meta: { expected: row.columnsCount, actual: row.columns.length },
        },
      });
    }

    assertColumns(row.columns, [...rowPath, "columns"], pageCells);
  }
}

function assertColumns(
  columns: ReadonlyArray<BlockColumn>,
  path: Path,
  pageCells: Cell[],
) {
  const seenIds = new Set<string>();

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const colPath = [...path, i];

    const id = col.id?.trim?.() ?? "";

    if (!id) {
      throw new DomainError({
        code: EC.BLOCK_COLUMN_ID_REQUIRED,
        message: EC.BLOCK_COLUMN_ID_REQUIRED,
        details: { path: [...colPath, "id"] },
      });
    }

    if (seenIds.has(id)) {
      throw new DomainError({
        code: EC.BLOCK_COLUMN_ID_DUPLICATE,
        message: EC.BLOCK_COLUMN_ID_DUPLICATE,
        details: { path: [...colPath, "id"], meta: { id } },
      });
    }

    seenIds.add(id);

    if (!Array.isArray(col.cells)) {
      throw new DomainError({
        code: EC.BLOCK_CELLS_INVALID,
        message: EC.BLOCK_CELLS_INVALID,
        details: { path: [...colPath, "cells"] },
      });
    }

    for (let j = 0; j < col.cells.length; j++) {
      const cell = col.cells[j];

      assertCell(cell, [...colPath, "cells", j]);
      pageCells.push(cell);
    }
  }
}

type AssertInsertAtProps = {
  insertAt: number;
  size: number;
};

export function assertInsertAt({ insertAt, size }: AssertInsertAtProps): void {
  if (insertAt < 0 || insertAt > size) {
    throw new DomainError({
      code: EC.BLOCK_INSERT_AT_INVALID,
      message: EC.BLOCK_INSERT_AT_INVALID,
      details: {
        path: ["insertAt"],
        meta: { insertAt, size },
      },
    });
  }
}

type AssertPermutationProps = {
  ordered: ReadonlyArray<string>;
  current: ReadonlyArray<string>;
};

export function assertPermutation({
  ordered,
  current,
}: AssertPermutationProps): void {
  if (!Array.isArray(ordered)) {
    throw new DomainError({
      code: EC.BLOCK_ORDER_INVALID,
      message: EC.BLOCK_ORDER_INVALID,
      details: { path: ["orderedBlockIds"] },
    });
  }

  const currentSet = new Set(current.map((id) => String(id ?? "").trim()));
  const seen = new Set<string>();

  for (let i = 0; i < ordered.length; i++) {
    const id = ordered[i]?.trim?.() ?? "";

    if (!id) {
      throw new DomainError({
        code: EC.BLOCK_ID_REQUIRED,
        message: EC.BLOCK_ID_REQUIRED,
        details: { path: ["orderedBlockIds", i] },
      });
    }

    if (seen.has(id)) {
      throw new DomainError({
        code: EC.BLOCK_ID_DUPLICATE,
        message: EC.BLOCK_ID_DUPLICATE,
        details: { path: ["orderedBlockIds", i], meta: { id } },
      });
    }

    seen.add(id);

    if (!currentSet.has(id)) {
      throw new DomainError({
        code: EC.BLOCK_NOT_FOUND,
        message: EC.BLOCK_NOT_FOUND,
        details: { path: ["orderedBlockIds", i], meta: { id } },
      });
    }
  }

  if (ordered.length !== current.length) {
    throw new DomainError({
      code: EC.BLOCK_ORDER_INVALID,
      message: EC.BLOCK_ORDER_INVALID,
      details: {
        path: ["orderedBlockIds"],
        meta: { expected: current.length, actual: ordered.length },
      },
    });
  }
}
