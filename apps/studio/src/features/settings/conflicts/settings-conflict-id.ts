/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-id.ts
 * @layer studio/features/settings/conflicts
 * @description Stable, locale-independent identities for Settings OCC panels.
 */

export const SETTINGS_CONFLICT_SCOPES = [
  "identity",
  "header",
  "footer",
  "seo",
  "theme",
  "social",
  "primary-menu",
  "legal-menu",
] as const;

export type SettingsConflictScope = (typeof SETTINGS_CONFLICT_SCOPES)[number];

export function settingsConflictId(
  scope: SettingsConflictScope,
  sequence: number,
  currentRevision: number,
): string {
  return `settings-${scope}-${sequence}-${currentRevision}`;
}
