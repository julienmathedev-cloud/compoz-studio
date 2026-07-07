/**
 * @file packages/ui/src/styles/studio/layout.ts
 * @layer ui/styles/studio
 *
 * @description
 * Defines shared Studio layout class tokens for containers, panels, stacks, rows, grids, and common empty states.
 */

/* ---------------------------------------------------------------------------
 * PANELS / CARDS (SURFACES)
 * ------------------------------------------------------------------------- */

export const STUDIO_CONTAINER = [
  "mx-auto",
  "w-full",
  "max-w-screen-2xl",
  "px-3",
  "md:px-4",
  "lg:px-6",
] as const;

export const STUDIO_PAGE = [
  "flex",
  "flex-col",
  "py-6",
  "md:py-8",
  "lg:py-10",
] as const;

export const STUDIO_SECTION = ["flex", "flex-col", "space-y-6"] as const;

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

export const STACK_LG = ["space-y-6"] as const;

export const STACK_MD = ["space-y-4"] as const;

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

export const GRID_SM_2 = ["grid", "gap-4", "sm:grid-cols-2"] as const;

export const GRID_SM_3 = ["grid", "gap-4", "sm:grid-cols-3"] as const;

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
