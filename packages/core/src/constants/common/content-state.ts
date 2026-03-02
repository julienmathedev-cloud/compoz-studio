/**
 * @file packages/core/src/constants/common/content-state.ts
 * @layer core/constants/common
 *
 * @description
 * Constantes & types liés aux états de contenu (draft/published).
 * Invariants : valeurs stables (persistées) + type-guard robuste aux frontières.
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
export const WRITE_CONTENT_STATE = CONTENT_STATE.DRAFT;

/**
 * Type TypeScript dérivé de `CONTENT_STATE`.
 * Résultat : `"draft" | "published"`
 */
export type ContentState = (typeof CONTENT_STATE)[keyof typeof CONTENT_STATE];

/** Valeurs autorisées (dérivées de la source de vérité) pour des checks robustes. */
const CONTENT_STATE_VALUES = Object.values(CONTENT_STATE) as ContentState[];

/**
 * Garde de type pour vérifier qu’une valeur inconnue correspond à un `ContentState` valide.
 * Utilisé principalement aux frontières (HTTP, parsing de paramètres).
 */
export function isContentState(v: unknown): v is ContentState {
  return (
    typeof v === "string" && CONTENT_STATE_VALUES.includes(v as ContentState)
  );
}
