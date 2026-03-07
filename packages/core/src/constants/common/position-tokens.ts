/**
 * @file packages/core/src/constants/common/position-tokens.ts
 * @layer core/constants/common
 *
 * @description
 * Tokens immuables de positionnement relatifs utilisés pour manipuler
 * des listes ordonnées (insertions, déplacements).
 *
 * Ces tokens sont utilisés par les use-cases manipulant l’ordre
 * d’éléments (ex: pages, menus, blocks).
 */

/**
 * Position "ajouter à la fin de la liste".
 */
export const POS_APPEND = { kind: "append" } as const;

/**
 * Position "ajouter au début de la liste".
 */
export const POS_PREPEND = { kind: "prepend" } as const;

/**
 * Token de positionnement supporté par les opérations d’insertion ou déplacement
 * dans une liste ordonnée.
 */
export type PositionToken = typeof POS_APPEND | typeof POS_PREPEND;
