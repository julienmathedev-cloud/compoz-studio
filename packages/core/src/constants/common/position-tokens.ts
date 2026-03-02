/**
 * @file packages/core/src/constants/common/position-tokens.ts
 * @layer core/constants/common
 *
 * @description
 * Tokens immuables de positionnement relatifs pour opérations sur listes ordonnées.
 *
 * @remarks
 * - Choix volontaire : objets `as const` pour comparaisons par référence (`===`).
 */

/**
 * Position "ajouter à la fin".
 */
export const POS_APPEND = { kind: "append" } as const;

/**
 * Position "ajouter au début".
 */
export const POS_PREPEND = { kind: "prepend" } as const;

/** Token de positionnement supporté par les opérations d’insertion/déplacement. */
export type PositionToken = typeof POS_APPEND | typeof POS_PREPEND;
