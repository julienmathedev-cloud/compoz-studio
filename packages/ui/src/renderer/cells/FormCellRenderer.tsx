/**
 * @file packages/ui/src/renderer/cells/FormCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’un formulaire de contact structuré.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée (schema).
 * - Ignore la cellule si les contenus essentiels sont absents.
 * - Filtre les champs invalides ou incomplets.
 * - Utilise `SiteContactForm` pour le rendu visuel.
 */

import { normalizeString } from "@compoz/ui/lib/normalize";
import { SiteContactForm } from "@compoz/ui/site/components/molecules/SiteContactForm";
import type { SiteFormUi } from "@compoz/ui/site/site-ui.types";
import type {
  FormCellShape,
  FormFieldShape,
} from "@compoz/validation/pages/blocks/cells/cell";

export type FormCellRendererProps = Readonly<{
  cell?: FormCellShape | null;
  ui: SiteFormUi;
}>;

export function FormCellRenderer({ cell, ui }: FormCellRendererProps) {
  if (!cell) return null;

  const submitLabel = normalizeString(cell.submitLabel, "");
  if (!submitLabel) return null;

  const fields = normalizeFields(cell.fields);
  if (fields.length < 1) return null;

  return <SiteContactForm fields={fields} submitLabel={submitLabel} ui={ui} />;
}

FormCellRenderer.displayName = "FormCellRenderer";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function normalizeFields(
  fields: readonly FormFieldShape[] | undefined,
): FormFieldShape[] {
  if (!fields?.length) return [];

  return fields.filter(isRenderableFormField).map((field) => ({
    id: normalizeString(field.id, ""),
    name: normalizeString(field.name, ""),
    label: normalizeString(field.label, ""),
    type: field.type,
    placeholder: normalizeDefinedString(field.placeholder),
    required: field.required === true,
  }));
}

function isRenderableFormField(field: FormFieldShape): boolean {
  const id = normalizeString(field.id, "");
  const name = normalizeString(field.name, "");
  const label = normalizeString(field.label, "");

  if (!id || !name || !label) return false;

  return (
    field.type === "text" || field.type === "email" || field.type === "textarea"
  );
}

function normalizeDefinedString(value: string | undefined): string | undefined {
  const normalized = normalizeString(value ?? "", "");
  return normalized || undefined;
}
