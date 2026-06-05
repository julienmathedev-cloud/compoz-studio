/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/form.ts
 * @layer studio/app/api/adapters
 * @description
 * Adapteurs API Studio pour les cellules de type `FormCell`.
 */

import { trimClearableOrUndef, trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  FormCell,
  FormField,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  FormCellIntentDTO,
  FormFieldIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

function adaptFormField(dto: FormFieldIntentDTO): FormField {
  return {
    id: trimOrKeep(dto.id),
    name: trimOrKeep(dto.name),
    label: trimOrKeep(dto.label),
    type: dto.type,
    placeholder: dto.placeholder ? trimOrKeep(dto.placeholder) : null,
    required: dto.required,
  };
}

export function adaptFormCell(dto: FormCellIntentDTO): FormCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "form",
    cssClassName: trimClearableOrUndef(dto.cssClassName),
    to: trimOrKeep(dto.to),
    submitButton: {
      label: trimOrKeep(dto.submitButton.label),
      variant: dto.submitButton.variant ?? "default",
      icon: dto.submitButton.icon ?? null,
      iconPosition:
        dto.submitButton.iconPosition === "after" ? "after" : "before",
    },
    successMessage: dto.successMessage ? trimOrKeep(dto.successMessage) : null,
    errorMessage: dto.errorMessage ? trimOrKeep(dto.errorMessage) : null,
    fields: dto.fields.map(adaptFormField),
  };
}
