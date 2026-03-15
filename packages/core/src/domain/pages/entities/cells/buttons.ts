/**
 * @file packages/core/src/domain/pages/entities/cells/buttons.ts
 * @layer core/domain/pages
 * @description
 * Entité métier ButtonsCell.
 */

export type ButtonItemVariant = "default" | "secondary" | "outline" | "ghost";
export type ButtonsAlign = "left" | "center" | "right";
export type ButtonsGap = "sm" | "md" | "lg";

export type ButtonItem = {
  id: string;
  label: string;
  href: string;
  variant: ButtonItemVariant;
};

export type ButtonsCell = {
  id: string;
  kind: "buttons";
  align?: ButtonsAlign;
  gap?: ButtonsGap;
  items: ReadonlyArray<ButtonItem>;
};
