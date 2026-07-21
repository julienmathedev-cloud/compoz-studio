/**
 * @file packages/infra/src/pages/normalizers/normalize-persisted-page-blocks.ts
 * @layer infra/pages
 *
 * @description
 * Normalizes supported historical page block shapes before strict validation.
 *
 * @remarks
 * - Applies only to data read from persistence.
 * - Uses cell and item discriminants instead of inferring item types from shape.
 * - Supplies newly required nullable card properties on historical data.
 * - Leaves unrelated and invalid structures untouched so PageSchema remains
 *   responsible for strict validation.
 */

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeCardItem(item: unknown): unknown {
  if (!isRecord(item)) {
    return item;
  }

  return {
    ...item,
    eyebrow: item.eyebrow ?? null,
    button: item.button ?? null,
  };
}

function normalizeExtendedCardItem(item: unknown): unknown {
  if (!isRecord(item)) {
    return item;
  }

  return {
    ...item,
    eyebrow: item.eyebrow ?? null,
    footer: item.footer ?? null,
    button: item.button ?? null,
  };
}

function normalizeCardCollectionCell(cell: UnknownRecord): UnknownRecord {
  switch (cell.cardKind) {
    case "card":
      return {
        ...cell,
        items: normalizeItems(cell.items, normalizeCardItem),
      };

    case "extendedCard":
      return {
        ...cell,
        items: normalizeItems(cell.items, normalizeExtendedCardItem),
      };

    default:
      return cell;
  }
}

function normalizeCarouselCell(cell: UnknownRecord): UnknownRecord {
  switch (cell.itemKind) {
    case "card":
      return {
        ...cell,
        items: normalizeItems(cell.items, normalizeCardItem),
      };

    case "extendedCard":
      return {
        ...cell,
        items: normalizeItems(cell.items, normalizeExtendedCardItem),
      };

    default:
      return cell;
  }
}

function normalizeItems(
  items: unknown,
  normalizeItem: (item: unknown) => unknown,
): unknown {
  return Array.isArray(items) ? items.map(normalizeItem) : items;
}

function normalizeCell(cell: unknown): unknown {
  if (!isRecord(cell)) {
    return cell;
  }

  switch (cell.kind) {
    case "cardCollection":
      return normalizeCardCollectionCell(cell);

    case "carousel":
      return normalizeCarouselCell(cell);

    default:
      return cell;
  }
}

function normalizeColumn(column: unknown): unknown {
  if (!isRecord(column) || !Array.isArray(column.cells)) {
    return column;
  }

  return {
    ...column,
    cells: column.cells.map(normalizeCell),
  };
}

function normalizeRow(row: unknown): unknown {
  if (!isRecord(row) || !Array.isArray(row.columns)) {
    return row;
  }

  return {
    ...row,
    columns: row.columns.map(normalizeColumn),
  };
}

function normalizeBlock(block: unknown): unknown {
  if (!isRecord(block) || block.type !== "section") {
    return block;
  }

  if (!Array.isArray(block.rows)) {
    return block;
  }

  return {
    ...block,
    rows: block.rows.map(normalizeRow),
  };
}

export function normalizePersistedPageBlocks(blocks: unknown): unknown {
  if (!Array.isArray(blocks)) {
    return blocks;
  }

  return blocks.map(normalizeBlock);
}
