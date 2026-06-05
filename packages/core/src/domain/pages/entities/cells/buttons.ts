/**
 * @file packages/core/src/domain/pages/entities/cells/buttons.ts
 * @layer core/domain/pages
 * @description
 * Entité métier ButtonsCell.
 */

import type { ContentIconKind } from "@compoz/core/constants/icons/content-icons";

export type ButtonItemVariant = "default" | "secondary" | "outline" | "ghost";
export type ButtonIconPosition = "before" | "after";
export type ButtonsAlign = "left" | "center" | "right";
export type ButtonsGap = "sm" | "md" | "lg";

export type ButtonPresentation = {
  label: string;
  variant: ButtonItemVariant;
  icon: ContentIconKind | null;
  iconPosition: ButtonIconPosition;
};

export type ButtonItem = ButtonPresentation & {
  id: string;
  href: string;
};

export type ButtonsCell = {
  id: string;
  kind: "buttons";
  cssClassName?: string;
  align: ButtonsAlign;
  gap: ButtonsGap;
  items: ReadonlyArray<ButtonItem>;
};
