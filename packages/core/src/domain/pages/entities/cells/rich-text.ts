/**
 * @file packages/core/src/domain/pages/entities/cells/rich-text.ts
 * @layer core/domain/pages
 * @description Rich text cell domain entity.
 */

export type RichTextCell = {
  id: string;
  kind: "richText";
  cssClassName?: string;
  content: string;
  reveal: boolean;
};
