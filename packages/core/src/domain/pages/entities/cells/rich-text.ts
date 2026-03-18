/**
 * @file packages/core/src/domain/pages/entities/cells/rich-text.ts
 * @layer core/domain/pages
 * @description
 * Entité métier RichTextCell.
 */

export type RichTextCell = {
  id: string;
  kind: "richText";
  content: string;
  reveal: boolean;
};
