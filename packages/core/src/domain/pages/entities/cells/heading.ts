/**
 * @file packages/core/src/domain/pages/entities/cells/heading.ts
 * @layer core/domain/pages
 * @description
 * Entité métier HeadingCell.
 */

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type HeadingAlign = "left" | "center";
export type HeadingVariant = "default" | "hero";

export type HeadingCell = {
  id: string;
  kind: "heading";
  level: HeadingLevel;
  title: string;
  subtitle?: string;
  align?: HeadingAlign;
  variant?: HeadingVariant;
  separator?: boolean;
  idAnchor?: string;
  reveal?: boolean;
  highlights?: string[];
};
