/**
 * @file packages/core/src/constants/common/content-state.ts
 * @layer core/constants/common
 *
 * @description
 * Persisted content state constants and derived TypeScript types.
 *
 * @remarks
 * - Values are persistence-stable and used by repositories, routes, and use cases.
 * /

/** Persisted content state values. */
export const CONTENT_STATE = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

/** Default state for newly created content or requests without an explicit state. */
export const DEFAULT_CONTENT_STATE = CONTENT_STATE.DRAFT;

/** Type union derived from `CONTENT_STATE`: `"draft" | "published"`. */
export type ContentState = (typeof CONTENT_STATE)[keyof typeof CONTENT_STATE];
