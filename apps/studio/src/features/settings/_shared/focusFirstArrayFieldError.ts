"use client";

/**
 * @file apps/studio/src/features/settings/_shared/focusFirstArrayFieldError.ts
 * @layer ui/studio/settings/shared
 *
 * @description
 * Helper UI pour cibler la première erreur d’un tableau RHF et déplacer le focus
 * sur le champ correspondant.
 *
 * @remarks
 * - Utilitaire purement UI : aucune logique métier.
 * - Couvre les formulaires à structure "items[index].field".
 * - Le choix du champ prioritaire reste piloté par l’appelant.
 * - La résolution de l’ID DOM reste pilotée par l’appelant pour éviter toute
 *   abstraction magique.
 * - Retourne `true` si un focus a été tenté, sinon `false`.
 */

import { focusByFieldId } from "@compoz/ui/lib/focus";

/**
 * Contrat minimal d’un item d’erreurs RHF pour un tableau.
 *
 * @remarks
 * - On ne dépend volontairement pas des types internes RHF ici.
 * - Il suffit que l’objet expose potentiellement des clés de champs invalides.
 */
type ArrayItemErrorLike<TFieldKey extends string> = Partial<
  Record<TFieldKey, unknown>
>;

/**
 * Paramètres du helper `focusFirstArrayFieldError`.
 */
type FocusFirstArrayFieldErrorParams<TFieldKey extends string> = Readonly<{
  /**
   * Tableau d’erreurs RHF pour `items`.
   *
   * @example
   * `formErrors.items`
   */
  itemErrors:
    | ReadonlyArray<ArrayItemErrorLike<TFieldKey> | undefined>
    | unknown;

  /**
   * Priorité des champs à tester pour un item.
   *
   * @example
   * `["label", "href"]`
   */
  fieldPriority: readonly TFieldKey[];

  /**
   * Résout l’ID DOM du champ à focus.
   *
   * @returns un `fieldId` exploitable par `focusByFieldId`
   */
  getFieldId: (index: number, field: TFieldKey) => string | undefined;
}>;

/**
 * Cible la première erreur d’un tableau RHF et tente de focus le champ associé.
 *
 * @returns
 * - `true` si un champ cible a été trouvé et transmis à `focusByFieldId`
 * - `false` sinon
 */
export function focusFirstArrayFieldError<TFieldKey extends string>({
  itemErrors,
  fieldPriority,
  getFieldId,
}: FocusFirstArrayFieldErrorParams<TFieldKey>): boolean {
  if (!Array.isArray(itemErrors) || itemErrors.length === 0) {
    return false;
  }

  const firstIndex = itemErrors.findIndex((itemError) => {
    if (!itemError) return false;

    return fieldPriority.some((field) => Boolean(itemError[field]));
  });

  if (firstIndex < 0) {
    return false;
  }

  const firstField = fieldPriority.find((field) =>
    Boolean(itemErrors[firstIndex]?.[field]),
  );

  if (!firstField) {
    return false;
  }

  const targetId = getFieldId(firstIndex, firstField);
  if (!targetId) {
    return false;
  }

  focusByFieldId(targetId);
  return true;
}
