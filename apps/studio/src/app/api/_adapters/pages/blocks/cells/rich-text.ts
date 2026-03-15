/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/rich-text.ts
 */

import { sanitizeRichTextHtml } from "@compoz/infra/lib/sanitize-rich-text";
import { trimOrKeep } from "@compoz/studio/lib/strings";

import type { RichTextCell } from "@compoz/core/domain/pages/entities/cell";
import type { RichTextCellIntentDTO } from "@compoz/validation/pages/blocks/cells/cell-intents";

export function adaptRichTextCell(dto: RichTextCellIntentDTO): RichTextCell {
  const raw = typeof dto.content === "string" ? dto.content : "";
  const safe = sanitizeRichTextHtml(raw);

  return {
    id: trimOrKeep(dto.id),
    kind: "richText",
    content: safe,
  };
}
