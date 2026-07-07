"use client";

/**
 * @file apps/studio/src/components/molecules/fields/ImageSelector.tsx
 * @layer studio/molecules/fields
 *
 * @description
 * Controlled image selector with file input, local preview, and optional upload pipeline.
 *
 * @remarks
 * - The final value is controlled through `url` and `onUrlChange`.
 * - `onFileSelect` can run an async upload pipeline and return the finalized public image.
 * - Uses `URL.createObjectURL` for local previews and revokes blob URLs on cleanup.
 * - ARIA ids for field, hint, and error are provided by the parent through `ids`.
 */

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { LoadingStatus } from "@compoz/studio/components/atoms/LoadingStatus";
import { ErrorText } from "@compoz/studio/components/atoms/typography/ErrorText";
import { HelpText } from "@compoz/studio/components/atoms/typography/HelpText";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@compoz/ui/components/ui/field";
import { Spinner } from "@compoz/ui/components/ui/spinner";
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { EMPTY_CARD } from "@compoz/ui/styles/studio/layout";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
  mediaAssetId?: string;
}>;

type ImageSelectorPreviewMode = "fill" | "icon";

type ImageSelectorProps = Readonly<{
  ids: FieldIds;
  name?: string;
  label: string;
  url: string;
  onUrlChange: (next: string) => void;
  disabled?: boolean;
  accept?: string;
  previewAlt: string;
  help?: string;
  /** Optional upload pipeline returning the finalized image metadata. */
  onFileSelect?: (file: File) => Promise<UploadedRasterImage>;
  onUploaded?: (meta: UploadedRasterImage) => void;
  preferredTypes?: ReadonlyArray<string>;
  preferredTypeHint?: string;
  /** UI-side maximum file size in bytes; must match the server limit. */
  maxBytes?: number;
  onClear?: () => void;
  /** External validation error, for example from RHF/Zod. */
  invalid?: boolean;
  errorMessage?: string;
  /** Preview rendering mode: `fill` for normal images, `icon` for centered fixed-size assets. */
  previewMode?: ImageSelectorPreviewMode;
  /** Pixel size used by `icon` preview mode. */
  previewSize?: number;
}>;

export function ImageSelector({
  ids,
  name,
  label,
  url,
  onUrlChange,
  disabled,
  accept = "image/*",
  previewAlt,
  help,
  onFileSelect,
  onUploaded,
  preferredTypes,
  preferredTypeHint,
  maxBytes,
  onClear,
  invalid,
  errorMessage,
  previewMode = "fill",
  previewSize = 128,
}: ImageSelectorProps) {
  const { fieldId, errorId, hintId } = ids;

  const t = useTranslations();

  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const [typeHint, setTypeHint] = useState<string | undefined>(undefined);
  const [localPreview, setLocalPreview] = useState<string | undefined>();
  const [pickedName, setPickedName] = useState<string | undefined>();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobRef = useRef<string | undefined>(undefined);

  // Revoke the local blob URL on unmount.
  useEffect(() => {
    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
      }
    };
  }, []);

  // Local errors take priority over external RHF/Zod errors.
  const effectiveError =
    fileError ?? (invalid ? (errorMessage ?? undefined) : undefined);

  const isInvalid = Boolean(effectiveError);

  const describedByIds: string[] = [];
  const hasHintContent = Boolean(typeHint) || Boolean(help);

  if (hintId && hasHintContent) {
    describedByIds.push(hintId);
  }

  // Reference the error id when either local or external validation fails.
  if (errorId && isInvalid) {
    describedByIds.push(errorId);
  }

  const describedBy =
    describedByIds.length > 0 ? describedByIds.join(" ") : undefined;

  // Display the picked file name, falling back to the remote URL filename.
  const showName = pickedName || (url ? url.split("/").pop() : "");

  const isBusy = Boolean(uploading);
  const isSavingLocked = Boolean(disabled);
  const isLocked = Boolean(isSavingLocked || uploading);

  // Keep empty previews compact.
  const PREVIEW_MIN_HEIGHT = 180;

  const isDeleteDisabled = isLocked || (!url && !localPreview && !pickedName);

  function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let v = bytes;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v = v / 1024;
      i++;
    }
    const rounded = i === 0 ? Math.round(v) : Math.round(v * 10) / 10;
    return `${rounded} ${units[i]}`;
  }

  async function doUpload(file: File) {
    if (!onFileSelect) return;

    try {
      setUploading(true);
      const uploaded = await onFileSelect(file);

      // Public URL becomes the controlled value.
      onUrlChange(uploaded.url);

      // Forward finalized image metadata such as width and height.
      onUploaded?.(uploaded);

      setFileError(undefined);
    } catch (err) {
      const msg =
        (err as { message?: string })?.message ?? t("uiErrors.uploadFailed");
      setFileError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleFileChange(file: File) {
    try {
      // Enforce image MIME types before preview/upload.
      if (!file.type.startsWith("image/")) {
        setFileError(t("uiErrors.notImage"));
        return;
      }

      // Mirror the server-side max file size when provided.
      if (typeof maxBytes === "number" && Number.isFinite(maxBytes)) {
        if (file.size > maxBytes) {
          setFileError(
            t("uiErrors.fileTooLarge", {
              max: formatBytes(maxBytes),
            }),
          );
          return;
        }
      }

      setFileError(undefined);

      // Show a non-blocking hint when the MIME type is not recommended.
      if (Array.isArray(preferredTypes) && preferredTypes.length > 0) {
        if (!preferredTypes.includes(file.type)) {
          setTypeHint(
            preferredTypeHint ??
              t("studio.imageSelector.hints.notRecommendedType", { types: "" }),
          );
        } else {
          setTypeHint(undefined);
        }
      } else {
        setTypeHint(undefined);
      }

      // Create a local preview URL and revoke the previous one.
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      blobRef.current = objectUrl;
      setLocalPreview(objectUrl);
      setPickedName(file.name);

      // Optional upload updates the controlled public URL.
      if (onFileSelect) {
        await doUpload(file);
      }
    } finally {
      // Allow selecting the same file again.
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function clearAll() {
    setPickedName(undefined);
    setLocalPreview(undefined);
    setFileError(undefined);
    setTypeHint(undefined);

    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = undefined;
    }

    onUrlChange("");
    onClear?.();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openPicker() {
    if (isLocked) return;
    fileInputRef.current?.click();
  }

  const hasPreview = Boolean(localPreview || url);
  const src = localPreview || url;
  const isBlob = Boolean(localPreview?.startsWith("blob:"));

  return (
    <Field
      // Use the effective local-or-external error state.
      data-invalid={isInvalid ? true : undefined}
      aria-busy={isBusy || undefined}
    >
      <FieldLabel visualMode="studio" htmlFor={fieldId}>
        {label}
      </FieldLabel>

      {/* Screen-reader-only upload status without layout shift. */}
      {uploading && (
        <LoadingStatus
          label={t("studio.imageSelector.uploadingSr")}
          withSpinner={false}
          className="sr-only"
        />
      )}

      {/* Hidden file input controlled by the clickable preview area. */}
      <input
        ref={fileInputRef}
        id={fieldId}
        name={name}
        type="file"
        accept={accept}
        disabled={isLocked}
        tabIndex={-1}
        aria-describedby={describedBy}
        aria-invalid={isInvalid ? true : undefined}
        onChange={async (e) => {
          const f = e.currentTarget.files?.[0];
          if (!f) return;
          await handleFileChange(f);
        }}
        className="sr-only"
      />

      {/* Interactive area: empty placeholder or selected preview. */}
      <div className="relative w-full">
        <TooltipButton
          type="button"
          disabled={uploading}
          tooltip={showName || undefined}
          tabIndex={isLocked ? -1 : 0}
          onClick={openPicker}
          aria-disabled={isLocked || undefined}
          variant="default"
          visualMode="studio"
          className={cn(
            EMPTY_CARD,
            hasPreview && "pr-10 pl-10",
            "flex w-full bg-muted/20",
            !isLocked &&
              "cursor-pointer hover:bg-muted/50 hover:border-primary",
            isLocked && "cursor-not-allowed",
            uploading && "opacity-70",
          )}
          style={{ minHeight: PREVIEW_MIN_HEIGHT }}
          aria-label={t("studio.imageSelector.previewAria")}
        >
          <div className="relative h-full w-full">
            {uploading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Spinner className="scale-150 text-primary" />
              </div>
            ) : null}

            {hasPreview ? (
              <div
                className={cn(
                  "relative h-full w-full",
                  uploading && "opacity-0",
                )}
              >
                {previewMode === "icon" ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <Image
                      src={src}
                      alt={previewAlt}
                      width={previewSize}
                      height={previewSize}
                      className="object-contain"
                      unoptimized={isBlob}
                    />
                  </div>
                ) : (
                  <Image
                    src={src}
                    alt={previewAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain"
                    unoptimized={isBlob}
                  />
                )}
              </div>
            ) : (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center",
                  uploading && "opacity-0",
                )}
              >
                <EmptyState text={t("studio.imageSelector.chooseFile")} />
              </div>
            )}
          </div>
        </TooltipButton>
        {isSavingLocked && !uploading ? (
          <div
            className="absolute inset-0 z-10 opacity-0 cursor-not-allowed rounded-[inherit]"
            aria-hidden="true"
          />
        ) : null}

        {/* Secondary delete action. */}
        <div className="absolute right-2 top-2 flex items-center gap-2">
          <DeleteButton
            disabled={isDeleteDisabled}
            disabledTooltip={
              isBusy
                ? t("studio.imageSelector.tooltips.disabledWhileUploading")
                : t("studio.imageSelector.tooltips.nothingToDelete")
            }
            onConfirmDelete={clearAll}
            confirm={{
              title: t("studio.imageSelector.confirm.title"),
              description: t("studio.imageSelector.confirm.description"),
            }}
          />
        </div>
      </div>

      {/* Help text or non-blocking recommended-type hint. */}
      {(typeHint || help) && (
        <FieldDescription visualMode="studio" id={hintId}>
          {typeHint ? (
            <Text as="span" variant="meta">
              {typeHint}
            </Text>
          ) : (
            <HelpText as="span">{help}</HelpText>
          )}
        </FieldDescription>
      )}

      {/* Blocking local or external validation error. */}
      {effectiveError && (
        <FieldError id={errorId}>
          <ErrorText error={effectiveError} />
        </FieldError>
      )}
    </Field>
  );
}

ImageSelector.displayName = "ImageSelector";
