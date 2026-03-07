/**
 * @file packages/ui/src/styles/studio/layout.ts
 * @layer styles/studio
 * @description
 * Constantes utilitaires pour la mise en page du Studio : containers, panels,
 * stacks (rythmes verticaux), rows, grilles et utilitaires communs.
 *
 * Objectif :
 * - imposer un rythme visuel cohérent
 * - éviter les espacements “au feeling”
 * - servir de socle à toutes les pages Studio (V0.5)
 */

/* ---------------------------------------------------------------------------
 * CONTAINERS & PAGE LAYOUT
 * ------------------------------------------------------------------------- */

/** Container principal des pages Studio */
export const STUDIO_CONTAINER = [
  "mx-auto",
  "w-full",
  "max-w-screen-2xl",
  "px-3",
  "md:px-4",
  "lg:px-6",
] as const;

/** Wrapper de page Studio (rythme vertical global) */
export const STUDIO_PAGE = [
  "flex",
  "flex-col",
  "py-6",
  "md:py-8",
  "lg:py-10",
] as const;

/** Section logique dans une page (groupement de panels) */
export const STUDIO_SECTION = ["flex", "flex-col", "space-y-6"] as const;

/* ---------------------------------------------------------------------------
 * PANELS / CARDS (SURFACES)
 * ------------------------------------------------------------------------- */

export const STUDIO_SHADOW_PANEL = ["shadow-sm"] as const;

export const STUDIO_BORDER_PANEL = [
  "rounded-xl",
  "border",
  "border-border",
  ...STUDIO_SHADOW_PANEL,
] as const;

/* ---------------------------------------------------------------------------
 * STACKS (RYTHMES VERTICAUX)
 * ------------------------------------------------------------------------- */

/*
 * Rythme large :
 * - section (contenu principal)
 */
export const STACK_LG = ["space-y-6"] as const;

/**
 * Rythme interne de section (contenu principal)
 */
export const STACK_MD = ["space-y-4"] as const;

/**
 * Rythme serré :
 * - header de section (title/description)
 * - groupes de champs liés (form)
 */
export const STACK_SM = ["space-y-2"] as const;

/* ---------------------------------------------------------------------------
 * ROWS (ALIGNEMENTS HORIZONTAUX)
 * ------------------------------------------------------------------------- */

export const ROW_SM = ["flex", "items-center", "gap-2"] as const;

export const ROW_BETWEEN = ["flex", "items-center", "justify-between"] as const;

export const ROW_END = [
  "flex",
  "items-center",
  "justify-end",
  "gap-2",
] as const;

export const ROW_CENTER = [
  "flex",
  "items-center",
  "justify-center",
  "gap-2",
] as const;

/* ---------------------------------------------------------------------------
 * GRILLES & GROUPES DE CHAMPS
 * ------------------------------------------------------------------------- */

/** Grille standard de champs (2 colonnes) */
export const GRID_SM_2 = ["grid", "gap-4", "sm:grid-cols-2"] as const;

/** Grille standard de champs (3 colonnes) */
export const GRID_SM_3 = ["grid", "gap-4", "sm:grid-cols-3"] as const;

/** État vide de liste */
export const EMPTY_CARD = [
  "rounded-xl",
  "border",
  "border-dashed",
  "border-border",
  "p-6",
  "text-sm",
  "text-muted-foreground",
] as const;

/* ---------------------------------------------------------------------------
 * DIVERS
 * ------------------------------------------------------------------------- */

export const MENU_ITEM_LAYOUT = [
  "grid",
  "gap-2",
  "md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,auto)]",
  "md:items-start",
] as const;
