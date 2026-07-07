/**
 * @file packages/core/src/domain/errors/issue.types.ts
 * @layer core/domain/errors
 * @description Lightweight types for non-blocking domain warnings exposed to the UI.
 * @remarks
 * Issues are not domain errors, are not mapped to HTTP responses, and never block save or publish flows.
 */

/**
 * Path to the model field targeted by a warning, used by the UI for focused feedback.
 */
export type IssuePath = ReadonlyArray<string | number>;

/**
 * Minimal UI-facing warning shape.
 *
 * @typeParam C - Stable warning code.
 */
export type UiWarning<C extends string = string> = Readonly<{
  /** Stable deterministic warning code. */
  code: C;

  /** Optional model path when the warning targets a specific field. */
  path?: IssuePath;

  /** Optional context for UI rendering or i18n interpolation. */
  meta?: Readonly<Record<string, unknown>>;
}>;
