/**
 * @file packages/core/src/domain/pages/entities/cells/form.ts
 * @layer core/domain/pages
 * @description
 * Entité métier FormCell (formulaire de contact).
 */

export type FormFieldType = "text" | "email" | "textarea";

export type FormField = {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
};

export type FormCell = {
  id: string;
  kind: "form";

  /**
   * Destination du formulaire au format `mailto:`
   */
  to: string;

  /**
   * Texte du bouton de soumission
   */
  submitLabel: string;

  /**
   * Message affiché après envoi réussi
   */
  successMessage?: string;

  /**
   * Message affiché en cas d'erreur
   */
  errorMessage?: string;

  /**
   * Champs du formulaire
   */
  fields: FormField[];
};
