/**
 * @file packages/core/src/domain/pages/entities/cells/separator.ts
 * @layer core/domain/pages
 * @description Separator cell domain entity.
 */

export type SeparatorAlign = "left" | "center" | "right" | "full";
export type SeparatorSize = "sm" | "md" | "lg";

export type SeparatorCell = {
  id: string;
  kind: "separator";
  cssClassName?: string;
  align: SeparatorAlign;
  size: SeparatorSize;
};
