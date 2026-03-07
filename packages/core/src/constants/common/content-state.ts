/**
 * @file packages/core/src/constants/common/content-state.ts
 * @layer core/constants/common
 *
 * @description
 * Constantes & types liés aux états de contenu persistés (draft/published).
 * Invariants : valeurs stables utilisées dans la persistance et les use-cases.
 */

/* -------------------------------------------------------------------------- */
/*                            États de contenu (pages)                        */
/* -------------------------------------------------------------------------- */

/**
 * États possibles d’un contenu (valeurs persistées).
 */
export const CONTENT_STATE = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

/**
 * État par défaut pour un contenu nouvellement créé.
 * Utilisé notamment lorsqu’aucun `?state=` n’est précisé.
 */
export const DEFAULT_CONTENT_STATE = CONTENT_STATE.DRAFT;

/**
 * Type TypeScript dérivé de `CONTENT_STATE`.
 * Résultat : `"draft" | "published"`
 */
export type ContentState = (typeof CONTENT_STATE)[keyof typeof CONTENT_STATE];
