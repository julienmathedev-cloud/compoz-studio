/**
 * @file packages/infra/src/pages/mappers/page-legacy-normalizer.ts
 * @layer infra/pages
 * @description Normalizes legacy page payload shapes shared by page repositories.
 * @remarks
 * Keeps old stored pages readable while newer schemas and repositories own validation.
 */

import { CONTENT_ICON_KINDS } from "@compoz/core/constants/icons/content-icons";

const BUTTON_VARIANTS = new Set(["default", "secondary", "outline", "ghost"]);
const BUTTON_ICON_POSITIONS = new Set(["before", "after"]);

type ContentIconKind = (typeof CONTENT_ICON_KINDS)[number];

function isContentIconKind(value: unknown): value is ContentIconKind {
  return (
    typeof value === "string" &&
    CONTENT_ICON_KINDS.includes(value.trim() as ContentIconKind)
  );
}

function normalizeButtonIcon(value: unknown): ContentIconKind | null {
  return isContentIconKind(value) ? (value.trim() as ContentIconKind) : null;
}

function normalizeButtonIconPosition(value: unknown): "before" | "after" {
  const position = typeof value === "string" ? value.trim() : "";

  return BUTTON_ICON_POSITIONS.has(position) && position === "after"
    ? "after"
    : "before";
}

function normalizeButtonVariant(value: unknown): string {
  const variant = typeof value === "string" ? value.trim() : "";

  return BUTTON_VARIANTS.has(variant) ? variant : "default";
}

function normalizeRowReverseOn(value: unknown): {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
} {
  const safe =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<{
          mobile: boolean;
          tablet: boolean;
          desktop: boolean;
        }>)
      : undefined;

  return {
    mobile: Boolean(safe?.mobile),
    tablet: Boolean(safe?.tablet),
    desktop: Boolean(safe?.desktop),
  };
}

function normalizeImageCellLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const cell = value as Record<string, unknown>;

  if (cell.kind !== "image") {
    return value;
  }

  return {
    ...cell,
    zoomEnabled:
      typeof cell.zoomEnabled === "boolean" ? cell.zoomEnabled : false,
  };
}

function normalizeTimelineCellLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const cell = value as Record<string, unknown>;

  if (cell.kind !== "timeline") {
    return value;
  }

  return {
    ...cell,
    collapsible:
      typeof cell.collapsible === "boolean" ? cell.collapsible : true,
  };
}

function normalizeButtonPresentationLegacy(
  value: unknown,
  fallbackLabel: string,
): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const button = value as Record<string, unknown>;

  const label =
    typeof button.label === "string" && button.label.trim()
      ? button.label.trim()
      : fallbackLabel;

  return {
    ...button,
    label,
    variant: normalizeButtonVariant(button.variant),
    icon: normalizeButtonIcon(button.icon),
    iconPosition: normalizeButtonIconPosition(button.iconPosition),
  };
}

function normalizeOptionalButtonItemLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const button = value as Record<string, unknown>;
  const label = typeof button.label === "string" ? button.label.trim() : "";

  if (!label) {
    return null;
  }

  return normalizeButtonPresentationLegacy(button, "");
}

function normalizeButtonsCellLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const cell = value as Record<string, unknown>;

  if (cell.kind !== "buttons" || !Array.isArray(cell.items)) {
    return value;
  }

  return {
    ...cell,
    items: cell.items.map((item) =>
      normalizeButtonPresentationLegacy(item, ""),
    ),
  };
}

function normalizeStructuredCardItemLegacy(item: unknown): unknown {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return item;
  }

  const structuredCardItem = item as Record<string, unknown>;

  return {
    ...structuredCardItem,
    button: normalizeOptionalButtonItemLegacy(structuredCardItem.button),
  };
}

function normalizeFormCellLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const cell = value as Record<string, unknown>;

  if (cell.kind !== "form") {
    return value;
  }

  const submitButton =
    cell.submitButton && typeof cell.submitButton === "object"
      ? (cell.submitButton as Record<string, unknown>)
      : undefined;

  const legacySubmitLabel =
    typeof cell.submitLabel === "string" ? cell.submitLabel.trim() : "";

  const legacyVariantButton =
    typeof cell.variantButton === "string" ? cell.variantButton.trim() : "";

  const normalizedSubmitButton = normalizeButtonPresentationLegacy(
    submitButton ?? {
      label: legacySubmitLabel || "Envoyer",
      variant: normalizeButtonVariant(legacyVariantButton),
    },
    legacySubmitLabel || "Envoyer",
  );

  const {
    submitLabel: _submitLabel,
    variantButton: _variantButton,
    submitButton: _legacySubmitButton,
    ...rest
  } = cell;

  return {
    ...rest,
    submitButton: normalizedSubmitButton,
  };
}

function normalizeCarouselCellLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const cell = value as Record<string, unknown>;

  if (cell.kind !== "carousel" || !Array.isArray(cell.items)) {
    return value;
  }

  if (cell.itemKind !== "structuredCard") {
    return value;
  }

  return {
    ...cell,
    items: cell.items.map(normalizeStructuredCardItemLegacy),
  };
}

function normalizeCellLegacy(value: unknown): unknown {
  return normalizeCarouselCellLegacy(
    normalizeButtonsCellLegacy(
      normalizeFormCellLegacy(
        normalizeTimelineCellLegacy(normalizeImageCellLegacy(value)),
      ),
    ),
  );
}

function normalizeColumnLegacy(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const column = value as Record<string, unknown>;

  if (!Array.isArray(column.cells)) {
    return value;
  }

  return {
    ...column,
    cells: column.cells.map(normalizeCellLegacy),
  };
}

export function normalizePageLegacyBlocks(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return input;
  }

  const page = input as Record<string, unknown>;
  const seoDescription =
    typeof page.seoDescription === "string"
      ? page.seoDescription.trim() || null
      : null;

  if (!Array.isArray(page.blocks)) {
    return {
      ...page,
      seoDescription,
    };
  }

  return {
    ...page,
    seoDescription,
    blocks: page.blocks.map((block) => {
      if (!block || typeof block !== "object" || Array.isArray(block)) {
        return block;
      }

      const safeBlock = block as {
        type?: unknown;
        rows?: unknown;
      };

      if (safeBlock.type !== "section" || !Array.isArray(safeBlock.rows)) {
        return block;
      }

      return {
        ...safeBlock,
        rows: safeBlock.rows.map((row) => {
          if (!row || typeof row !== "object" || Array.isArray(row)) {
            return row;
          }

          const safeRow = row as {
            reverseOn?: unknown;
            columns?: unknown;
          };

          return {
            ...safeRow,
            reverseOn: normalizeRowReverseOn(safeRow.reverseOn),
            columns: Array.isArray(safeRow.columns)
              ? safeRow.columns.map(normalizeColumnLegacy)
              : safeRow.columns,
          };
        }),
      };
    }),
  };
}
