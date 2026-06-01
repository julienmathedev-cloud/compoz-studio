/**
 * @file packages/core/src/domain/pages/entities/cells/spacer.ts
 * @layer core/domain/pages
 * @description
 * Entité métier SpacerCell.
 */

export type SpacerSize = "sm" | "md" | "lg" | "xl";

export type SpacerVisibility = {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
};

export type SpacerCell = {
  id: string;
  kind: "spacer";
  cssClassName?: string;
  size: SpacerSize;
  visibility: SpacerVisibility;
};
