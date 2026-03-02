"use client";

/**
 * @file apps/studio/src/lib/ui/notify-presets.ts
 * @layer lib/ui
 * @description
 * Presets de notifications pour l’admin.
 * Les messages (title/description) doivent être fournis **déjà traduits** par l’appelant.
 */

import { notify } from "@compoz/studio/lib/ui/notify";

/* -------------------------------------------------------------------------- */
/*                              Actions élémentaires                           */
/* -------------------------------------------------------------------------- */

/**
 * Notification lors de la création d’un nouvel élément.
 *
 * @param title       Titre traduit de la notification
 * @param description Description traduite de la notification
 */
export function notifyCreated(title: string, description: string): void {
  notify.success(title, description);
}

/**
 * Notification de suppression d’un élément.
 *
 * @param title       Titre traduit de la notification
 * @param description Description traduite de la notification
 */
export function notifyDeleted(title: string, description: string): void {
  notify.success(title, description);
}

/**
 * Notification de mise à jour d’un élément.
 *
 * @param title       Titre traduit de la notification
 * @param description Description traduite de la notification
 */
export function notifyUpdated(title: string, description: string): void {
  notify.success(title, description);
}

/**
 * Notification utilisée lorsque l'utilisateur tente d'enregistrer
 * un formulaire sans aucune modification.
 *
 * @param title       Titre traduit de la notification
 * @param description Description traduite de la notification
 */
export function notifyNoChanges(title: string, description: string): void {
  notify.info(title, description);
}

/* -------------------------------------------------------------------------- */
/*                             Notifications d’erreurs                         */
/* -------------------------------------------------------------------------- */

/**
 * Notification d’erreur “métier/UI” (ex: action impossible, validation, publish…).
 *
 * @param title       Titre traduit de la notification
 * @param description Description traduite de la notification
 */
export function notifyValidationError(
  title: string,
  description: string,
): void {
  notify.error(title, description);
}
