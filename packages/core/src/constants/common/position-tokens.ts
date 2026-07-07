/**
 * @file packages/core/src/constants/common/position-tokens.ts
 * @layer core/constants/common
 *
 * @description
 * Immutable relative positioning tokens for ordered list mutations.
 *
 * @remarks
 * - Used by use cases that insert or move ordered items such as pages, menus, and blocks.
 */

/** Position token for appending an item to the end of an ordered list. */
export const POS_APPEND = { kind: "append" } as const;

/** Position token for prepending an item to the start of an ordered list. */
export const POS_PREPEND = { kind: "prepend" } as const;

/** Supported relative positioning token for insert or move operations. */
export type PositionToken = typeof POS_APPEND | typeof POS_PREPEND;
