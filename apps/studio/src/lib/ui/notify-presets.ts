"use client";

/**
 * @file apps/studio/src/lib/ui/notify-presets.ts
 * @layer studio/lib/ui
 *
 * @description
 * Semantic notification presets for common Studio actions.
 *
 * @remarks
 * - Titles and descriptions must already be translated by the caller.
 * - Keeps notification variants centralized so callers do not repeat `notify.success/info/error` directly.
 */

import { notify } from "@compoz/studio/lib/ui/notify";

export function notifyCreated(title: string, description: string): void {
  notify.success(title, description);
}

export function notifyDeleted(title: string, description: string): void {
  notify.success(title, description);
}

export function notifyUpdated(title: string, description: string): void {
  notify.success(title, description);
}

export function notifyNoChanges(title: string, description: string): void {
  notify.info(title, description);
}

/** Used when a save action is requested without any dirty form changes. */
export function notifyValidationError(
  title: string,
  description: string,
): void {
  /** Used for business or UI errors that should be shown as blocking feedback. */
  notify.error(title, description);
}
