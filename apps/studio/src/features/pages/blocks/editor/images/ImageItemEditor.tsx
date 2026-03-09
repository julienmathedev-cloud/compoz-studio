"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/images/ImageItemEditor.tsx
 * @layer ui/studio/pages/blocks/editor/images
 *
 * @description
 * Item editor pour une image de galerie : src/alt + actions (move / delete).
 *
 * @remarks
 * - UI-only.
 * - Réutilise `ImageFields`.
 * - N’émet plus un item complet reconstruit depuis un snapshot potentiellement stale.
 * - Émet des patches partiels pour laisser le parent fusionner avec l’état courant.
 */

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { StudioButtonGroup } from "@compoz/studio/components/molecules/controls/StudioButtonGroup";
import { ImageFields } from "@compoz/studio/features/_shared/components/ImageFields";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { ImageEditorFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type ImageItemPatch = Partial<ImageEditorFormValues>;

export type ImageItemEditorProps = Readonly<{
  idPrefix: string;
  index: number;
  total: number;

  value: ImageEditorFormValues;

  disabled?: boolean;
  canRemove: boolean;

  onPatch: (patch: ImageItemPatch) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;

  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
  srcInvalid?: boolean;
  srcErrorMessage?: string;
  linksEnabled?: boolean;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
}>;

export function ImageItemEditor({
  idPrefix,
  index,
  total,
  value,
  disabled = false,
  canRemove,
  onPatch,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUploadImage,
  srcInvalid,
  srcErrorMessage,
  linksEnabled = false,
  internalPageOptions,
}: ImageItemEditorProps) {
  const t = useTranslations();

  const isFirst = index === 0;
  const isLast = index === total - 1;

  const canMoveUp = !disabled && !isFirst;
  const canMoveDown = !disabled && !isLast;

  const handleSrcChange = (nextSrc: unknown) => {
    const nextSrcStr = String(nextSrc ?? "");
    const hasSrc = nextSrcStr.trim().length > 0;

    onPatch({
      src: nextSrcStr,
      // ✅ si src est vidé, on purge les dimensions pour éviter un stale display
      width: hasSrc ? value.width : undefined,
      height: hasSrc ? value.height : undefined,
    });
  };

  const handleAltChange = (nextAlt: unknown) => {
    onPatch({
      alt: String(nextAlt ?? ""),
    });
  };

  return (
    <Card className={cn("relative h-full", STACK_MD)}>
      <CardContent>
        {/* Header + actions */}
        <div className="absolute right-2 top-2 z-10">
          <StudioButtonGroup className="shrink-0">
            <TooltipButton
              type="button"
              variant="secondary"
              size="icon"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label={t("common.moveUp")}
              tooltip={
                !canMoveUp
                  ? disabled
                    ? t("common.actionUnavailable")
                    : isFirst
                      ? t("common.alreadyTop")
                      : t("common.actionUnavailable")
                  : t("common.moveUp")
              }
            >
              <StudioIcon icon={ChevronUp} />
            </TooltipButton>

            <TooltipButton
              type="button"
              variant="secondary"
              size="icon"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label={t("common.moveDown")}
              tooltip={
                !canMoveDown
                  ? disabled
                    ? t("common.actionUnavailable")
                    : isLast
                      ? t("common.alreadyBottom")
                      : t("common.actionUnavailable")
                  : t("common.moveDown")
              }
            >
              <StudioIcon icon={ChevronDown} />
            </TooltipButton>

            <DeleteButton
              disabled={!canRemove || disabled}
              onConfirmDelete={onRemove}
              ariaLabel={t("common.delete")}
              title={t("common.delete")}
            />
          </StudioButtonGroup>
        </div>

        {/* Image fields */}
        <div className="pt-1">
          <ImageFields
            idPrefix={idPrefix}
            disabled={disabled}
            onUploadImage={onUploadImage}
            onUploaded={(meta) => {
              onPatch({
                src: meta.url,
                width: meta.width,
                height: meta.height,
              });
            }}
            accept="image/jpeg,image/png,image/webp,image/avif"
            preferredTypes={["image/webp", "image/avif"]}
            preferredTypeHint={t(
              "studio.imageSelector.hints.notRecommendedType",
              {
                types: "WEBP, AVIF",
              },
            )}
            labels={{
              image: t("studio.cellEditorTabs.image.srcLabel"),
              alt: t("studio.cellEditorTabs.image.altLabel"),
            }}
            help={{
              image: t("studio.cellEditorTabs.image.srcHelp"),
              alt: t("studio.cellEditorTabs.image.altPlaceholder"),
            }}
            srcField={{
              value: value.src,
              onChange: handleSrcChange,
            }}
            altField={{
              value: value.alt,
              onChange: handleAltChange,
            }}
            hrefField={
              linksEnabled
                ? {
                    value: value.href ?? null,
                    onChange: (next) => onPatch({ href: next }),
                  }
                : undefined
            }
            internalPageOptions={linksEnabled ? internalPageOptions : undefined}
            srcInvalid={srcInvalid}
            srcErrorMessage={srcErrorMessage}
          />
        </div>
      </CardContent>
    </Card>
  );
}

ImageItemEditor.displayName = "ImageItemEditor";
