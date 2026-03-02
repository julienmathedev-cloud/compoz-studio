"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/images/ImageItemEditor.tsx
 * @layer ui/organisms
 *
 * @description
 * Item editor pour une image de galerie : src/alt + actions (move / delete).
 *
 * @remarks
 * - UI-only.
 * - Réutilise `ImageFields`.
 */

import { useTranslations } from "next-intl";

import { AdminIcon } from "@compoz/studio/components/atoms/AdminIcon";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { AdminButtonGroup } from "@compoz/studio/components/molecules/controls/AdminButtonGroup";
import { ImageFields } from "@compoz/studio/features/_shared/ui/molecules/fields/ImageFields";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { ImageEditorFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";
import { ChevronDown, ChevronUp } from "lucide-react";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

export type ImageItemEditorProps = Readonly<{
  idPrefix: string;
  index: number;
  total: number;

  value: ImageEditorFormValues;

  disabled?: boolean;
  canRemove: boolean;

  onChange: (next: ImageEditorFormValues) => void;
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
  onChange,
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

    const next: ImageEditorFormValues = {
      ...value,
      src: nextSrcStr,
      // option UX "safe" : si src est vidé, on purge les dims pour éviter du stale
      width: nextSrcStr.trim().length ? value.width : undefined,
      height: nextSrcStr.trim().length ? value.height : undefined,
    };

    onChange(next);
  };

  const handleAltChange = (nextAlt: unknown) => {
    const next: ImageEditorFormValues = {
      ...value,
      alt: String(nextAlt ?? ""),
    };
    onChange(next);
  };

  return (
    <Card className={cn("relative h-full", STACK_MD)}>
      <CardContent>
        {/* Header + actions */}
        <div className="absolute right-2 top-2 z-10">
          <AdminButtonGroup className="shrink-0">
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
              <AdminIcon icon={ChevronUp} />
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
              <AdminIcon icon={ChevronDown} />
            </TooltipButton>

            <DeleteButton
              disabled={!canRemove || disabled}
              onConfirmDelete={onRemove}
              ariaLabel={t("common.delete")}
              title={t("common.delete")}
            />
          </AdminButtonGroup>
        </div>

        {/* Image fields */}
        <div className="pt-1">
          <ImageFields
            idPrefix={idPrefix}
            disabled={disabled}
            onUploadImage={onUploadImage}
            onUploaded={(meta) => {
              // ✅ write width/height (numbers) + src url
              onChange({
                ...value,
                src: meta.url,
                width: meta.width,
                height: meta.height,
              });
            }}
            accept="image/jpeg,image/png,image/webp,image/avif"
            preferredTypes={["image/webp", "image/avif"]}
            preferredTypeHint={t(
              "admin.imageSelector.hints.notRecommendedType",
              {
                types: "WEBP, AVIF",
              },
            )}
            labels={{
              image: t("admin.cellEditorTabs.image.srcLabel"),
              alt: t("admin.cellEditorTabs.image.altLabel"),
            }}
            help={{
              image: t("admin.cellEditorTabs.image.srcHelp"),
              alt: t("admin.cellEditorTabs.image.altPlaceholder"),
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
                    onChange: (next) => onChange({ ...value, href: next }),
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
