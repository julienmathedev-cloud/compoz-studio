"use client";

/**
 * @file apps/studio/src/lib/ui/notify-presets.ts
 * @layer studio/lib/ui
 *
 * @description
 * Presets de notifications pour le Studio (admin).
 * Les messages (title/description) doivent être fournis **déjà traduits** par l’appelant.
 *
 * @remarks
 * - Fournit des helpers sémantiques pour éviter de répéter le type de notification.
 * - Wrap les appels vers `notify`.
 */

import { notify } from "@compoz/studio/lib/ui/notify";

/* -------------------------------------------------------------------------- */
/*                              Actions élémentaires                           */
/* -------------------------------------------------------------------------- */

/**
 * Notification lors de la création d’un nouvel élément.
 */
export function notifyCreated(title: string, description: string): void {
  notify.success(title, description);
}

/**
 * Notification de suppression d’un élément.
 */
export function notifyDeleted(title: string, description: string): void {
  notify.success(title, description);
}

/**
 * Notification de mise à jour d’un élément.
 */
export function notifyUpdated(title: string, description: string): void {
  notify.success(title, description);
}

/**
 * Notification utilisée lorsque l'utilisateur tente d'enregistrer
 * un formulaire sans aucune modification.
 */
export function notifyNoChanges(title: string, description: string): void {
  notify.info(title, description);
}

/* -------------------------------------------------------------------------- */
/*                             Notifications d’erreurs                         */
/* -------------------------------------------------------------------------- */

/**
 * Notification d’erreur “métier/UI” (ex: action impossible, validation, publish…).
 */
export function notifyValidationError(
  title: string,
  description: string,
): void {
  notify.error(title, description);
}
