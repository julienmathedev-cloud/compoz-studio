/**
 * @file packages/core/src/domain/pages/entities/cells/form.ts
 * @layer core/domain/pages
 * @description
 * Entité métier FormCell (formulaire de contact).
 */

import type {
  ButtonItemVariant,
  ButtonPresentation,
} from "@compoz/core/domain/pages/entities/cells/buttons";

export type FormFieldType = "text" | "email" | "textarea";

export type FormButtonVariant = ButtonItemVariant;
export type FormSubmitButton = ButtonPresentation;

export type FormField = {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder: string | null;
  required: boolean;
};

export type FormCell = {
  id: string;
  kind: "form";
  cssClassName?: string;

  /**
   * Destination du formulaire au format `mailto:`
   */
  to: string;

  /**
   * Bouton de soumission
   */
  submitButton: FormSubmitButton;

  /**
   * Message affiché après envoi réussi
   */
  successMessage: string | null;

  /**
   * Message affiché en cas d'erreur
   */
  errorMessage: string | null;

  /**
   * Champs du formulaire
   */
  fields: ReadonlyArray<FormField>;
};
