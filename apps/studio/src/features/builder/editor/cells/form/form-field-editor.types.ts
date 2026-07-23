/**
 * @file apps/studio/src/features/builder/editor/cells/form/form-field-editor.types.ts
 * @layer studio/features/builder/editor/cells/form
 *
 * @description
 * Shared React Hook Form path types used by form field editors.
 */

export type FormFieldBasePath =
  `rows.${number}.columns.${number}.cells.${number}`;

export type FormFieldItemPath = `${FormFieldBasePath}.fields.${number}`;

export type FormFieldOptionsPath = `${FormFieldItemPath}.options`;

export type FormSelectOptionItemPath = `${FormFieldOptionsPath}.${number}`;
