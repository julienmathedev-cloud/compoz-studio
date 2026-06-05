/**
 * @file packages/core/src/domain/pages/validators/cells/form.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur métier de FormCell.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { Cell, FormField } from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

const FORM_FIELD_TYPES = ["text", "email", "textarea"] as const;
const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost"] as const;

export function assertFormCell(
  cell: Extract<Cell, { kind: "form" }>,
  path: Path,
) {
  if (typeof cell.to !== "string" || !cell.to.trim()) {
    throw new DomainError({
      code: EC.CELL_FORM_TO_REQUIRED,
      message: EC.CELL_FORM_TO_REQUIRED,
      details: { path: [...path, "to"] },
    });
  }

  if (!isEmailDestination(cell.to)) {
    throw new DomainError({
      code: EC.CELL_FORM_TO_INVALID,
      message: EC.CELL_FORM_TO_INVALID,
      details: {
        path: [...path, "to"],
        meta: { value: cell.to, rule: "expects_valid_email" },
      },
    });
  }

  if (
    !cell.submitButton ||
    typeof cell.submitButton !== "object" ||
    typeof cell.submitButton.label !== "string" ||
    !cell.submitButton.label.trim()
  ) {
    throw new DomainError({
      code: EC.CELL_FORM_SUBMIT_LABEL_REQUIRED,
      message: EC.CELL_FORM_SUBMIT_LABEL_REQUIRED,
      details: { path: [...path, "submitButton", "label"] },
    });
  }

  if (!BUTTON_VARIANTS.includes(cell.submitButton.variant)) {
    throw new DomainError({
      code: EC.CELL_FORM_VARIANT_BUTTON_INVALID,
      message: EC.CELL_FORM_VARIANT_BUTTON_INVALID,
      details: {
        path: [...path, "submitButton", "variant"],
        meta: { variant: cell.submitButton.variant },
      },
    });
  }

  if (cell.successMessage !== null && typeof cell.successMessage !== "string") {
    throw new DomainError({
      code: EC.CELL_FORM_SUCCESS_MESSAGE_INVALID,
      message: EC.CELL_FORM_SUCCESS_MESSAGE_INVALID,
      details: { path: [...path, "successMessage"] },
    });
  }

  if (cell.errorMessage !== null && typeof cell.errorMessage !== "string") {
    throw new DomainError({
      code: EC.CELL_FORM_ERROR_MESSAGE_INVALID,
      message: EC.CELL_FORM_ERROR_MESSAGE_INVALID,
      details: { path: [...path, "errorMessage"] },
    });
  }

  if (!Array.isArray(cell.fields)) {
    throw new DomainError({
      code: EC.CELL_FORM_FIELDS_INVALID,
      message: EC.CELL_FORM_FIELDS_INVALID,
      details: { path: [...path, "fields"] },
    });
  }

  if (cell.fields.length < 1) {
    throw new DomainError({
      code: EC.CELL_FORM_FIELDS_MIN_1,
      message: EC.CELL_FORM_FIELDS_MIN_1,
      details: { path: [...path, "fields"] },
    });
  }

  for (let i = 0; i < cell.fields.length; i++) {
    assertFormField(cell.fields[i], [...path, "fields", i]);
  }
}

function assertFormField(field: FormField, path: Path) {
  if (!field || typeof field !== "object") {
    throw new DomainError({
      code: EC.CELL_FORM_FIELD_INVALID,
      message: EC.CELL_FORM_FIELD_INVALID,
      details: { path },
    });
  }

  if (typeof field.id !== "string" || !field.id.trim()) {
    throw new DomainError({
      code: EC.CELL_FORM_FIELD_ID_REQUIRED,
      message: EC.CELL_FORM_FIELD_ID_REQUIRED,
      details: { path: [...path, "id"] },
    });
  }

  if (typeof field.name !== "string" || !field.name.trim()) {
    throw new DomainError({
      code: EC.CELL_FORM_FIELD_NAME_REQUIRED,
      message: EC.CELL_FORM_FIELD_NAME_REQUIRED,
      details: { path: [...path, "name"] },
    });
  }

  if (typeof field.label !== "string" || !field.label.trim()) {
    throw new DomainError({
      code: EC.CELL_FORM_FIELD_LABEL_REQUIRED,
      message: EC.CELL_FORM_FIELD_LABEL_REQUIRED,
      details: { path: [...path, "label"] },
    });
  }

  if (
    typeof field.type !== "string" ||
    !FORM_FIELD_TYPES.includes(field.type)
  ) {
    throw new DomainError({
      code: EC.CELL_FORM_FIELD_TYPE_INVALID,
      message: EC.CELL_FORM_FIELD_TYPE_INVALID,
      details: {
        path: [...path, "type"],
        meta: { type: field.type },
      },
    });
  }

  if (field.placeholder !== null && typeof field.placeholder !== "string") {
    throw new DomainError({
      code: EC.CELL_FORM_FIELD_PLACEHOLDER_INVALID,
      message: EC.CELL_FORM_FIELD_PLACEHOLDER_INVALID,
      details: { path: [...path, "placeholder"] },
    });
  }

  if (typeof field.required !== "boolean") {
    throw new DomainError({
      code: EC.CELL_FORM_FIELD_REQUIRED_INVALID,
      message: EC.CELL_FORM_FIELD_REQUIRED_INVALID,
      details: { path: [...path, "required"] },
    });
  }
}

function isEmailDestination(value: string): boolean {
  const normalized = value.trim();

  if (!normalized) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}
