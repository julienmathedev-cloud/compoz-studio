/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells/image.ts
 */

import { trimClearableOrUndef, trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  ImageCell,
  ImageEditor,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  ImageCellIntentDTO,
  ImageEditorIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

function optionalTrimmedString(value: string | undefined): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : "";

  return trimmed ? trimmed : undefined;
}

export function adaptImage(dto: ImageEditorIntentDTO): ImageEditor {
  const mediaAssetId = optionalTrimmedString(dto.mediaAssetId);

  return {
    id: trimOrKeep(dto.id),
    src: trimOrKeep(dto.src),
    alt: trimOrKeep(dto.alt),
    caption:
      typeof dto.caption === "string" ? trimOrKeep(dto.caption) : dto.caption,
    href: typeof dto.href === "string" ? trimOrKeep(dto.href) : dto.href,
    width: dto.width ?? 0,
    height: dto.height ?? 0,
    ...(mediaAssetId ? { mediaAssetId } : {}),
  };
}

export function adaptImageCell(dto: ImageCellIntentDTO): ImageCell {
  return {
    id: trimOrKeep(dto.id),
    kind: "image",
    cssClassName: trimClearableOrUndef(dto.cssClassName),
    variant: dto.variant,
    size: dto.size,
    reveal: dto.reveal,
    zoomEnabled: dto.zoomEnabled,
    image: adaptImage(dto.image),
  };
}
