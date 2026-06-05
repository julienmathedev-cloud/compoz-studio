/**
 * @file packages/core/src/domain/pages/validators/cells/button.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de ButtonsCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  ButtonItem,
  ButtonPresentation,
  Cell,
} from "@compoz/core/domain/pages/entities/cell";
import { CONTENT_ICON_KINDS } from "@compoz/core/constants/icons/content-icons";

type Path = ReadonlyArray<string | number>;

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost"] as const;
const BUTTON_ICON_POSITIONS = ["before", "after"] as const;
const BUTTON_ALIGNS = ["left", "center", "right"] as const;
const BUTTON_GAPS = ["sm", "md", "lg"] as const;

export function assertButtonsCell(
  cell: Extract<Cell, { kind: "buttons" }>,
  path: Path,
) {
  if (!BUTTON_ALIGNS.includes(cell.align)) {
    throw new DomainError({
      code: EC.CELL_BUTTONS_ALIGN_INVALID,
      message: EC.CELL_BUTTONS_ALIGN_INVALID,
      details: { path: [...path, "align"], meta: { align: cell.align } },
    });
  }

  if (!BUTTON_GAPS.includes(cell.gap)) {
    throw new DomainError({
      code: EC.CELL_BUTTONS_GAP_INVALID,
      message: EC.CELL_BUTTONS_GAP_INVALID,
      details: { path: [...path, "gap"], meta: { gap: cell.gap } },
    });
  }

  if (!Array.isArray(cell.items)) {
    throw new DomainError({
      code: EC.CELL_BUTTONS_ITEMS_INVALID,
      message: EC.CELL_BUTTONS_ITEMS_INVALID,
      details: { path: [...path, "items"] },
    });
  }

  if (cell.items.length < 1) {
    throw new DomainError({
      code: EC.CELL_BUTTONS_ITEMS_MIN_1,
      message: EC.CELL_BUTTONS_ITEMS_MIN_1,
      details: { path: [...path, "items"] },
    });
  }

  for (let i = 0; i < cell.items.length; i++) {
    assertButtonItem(cell.items[i], [...path, "items", i]);
  }
}

export function assertButtonItem(item: ButtonItem, path: Path) {
  if (!item || typeof item !== "object") {
    throw new DomainError({
      code: EC.CELL_BUTTON_ITEM_INVALID,
      message: EC.CELL_BUTTON_ITEM_INVALID,
      details: { path },
    });
  }

  if (typeof item.id !== "string" || !item.id.trim()) {
    throw new DomainError({
      code: EC.CELL_BUTTON_ITEM_ID_REQUIRED,
      message: EC.CELL_BUTTON_ITEM_ID_REQUIRED,
      details: { path: [...path, "id"] },
    });
  }

  if (typeof item.label !== "string" || !item.label.trim()) {
    throw new DomainError({
      code: EC.CELL_BUTTON_ITEM_LABEL_REQUIRED,
      message: EC.CELL_BUTTON_ITEM_LABEL_REQUIRED,
      details: { path: [...path, "label"] },
    });
  }

  if (typeof item.href !== "string") {
    throw new DomainError({
      code: EC.CELL_BUTTON_ITEM_HREF_INVALID,
      message: EC.CELL_BUTTON_ITEM_HREF_INVALID,
      details: { path: [...path, "href"] },
    });
  }

  assertButtonPresentation(item, path);
}

export function assertButtonPresentation(
  button: ButtonPresentation,
  path: Path,
) {
  if (!BUTTON_VARIANTS.includes(button.variant)) {
    throw new DomainError({
      code: EC.CELL_BUTTON_ITEM_VARIANT_INVALID,
      message: EC.CELL_BUTTON_ITEM_VARIANT_INVALID,
      details: { path: [...path, "variant"], meta: { variant: button.variant } },
    });
  }

  if (
    button.icon !== null &&
    !CONTENT_ICON_KINDS.includes(button.icon)
  ) {
    throw new DomainError({
      code: EC.CELL_BUTTON_ICON_INVALID,
      message: EC.CELL_BUTTON_ICON_INVALID,
      details: { path: [...path, "icon"], meta: { icon: button.icon } },
    });
  }

  if (!BUTTON_ICON_POSITIONS.includes(button.iconPosition)) {
    throw new DomainError({
      code: EC.CELL_BUTTON_ICON_POSITION_INVALID,
      message: EC.CELL_BUTTON_ICON_POSITION_INVALID,
      details: {
        path: [...path, "iconPosition"],
        meta: { iconPosition: button.iconPosition },
      },
    });
  }
}
