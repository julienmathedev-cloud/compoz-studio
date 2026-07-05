"use client";

/**
 * @file apps/studio/src/components/molecules/media/ImageSelector.tsx
 * @layer studio/molecules
 *
 * @description
 * Sélecteur d’image contrôlé (input file + preview locale + upload optionnel).
 *
 * @remarks
 * - Molecule UI : compose des atoms et des primitives UI (Field).
 * - La valeur finale est contrôlée via `url` / `onUrlChange`.
 * - `onFileSelect` (optionnel) gère l’upload et retourne une URL publique.
 * - Gère une preview via `URL.createObjectURL` avec cleanup à l’unmount.
 * - Les IDs ARIA (champ / hint / error) sont fournis par le parent (`ids`).
 * - Strictement UI-only : aucune logique métier.
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

/**
 * Props du composant `ImageSelector`.
 */
type ImageSelectorProps = Readonly<{
  /** Ensemble des IDs ARIA pour ce champ (fournis par le parent). */
  ids: FieldIds;
  name?: string;
  /** Libellé du champ. */
  label: string;
  /** URL actuelle de l’image (contrôlée par le parent). */
  url: string;
  /** Callback de mise à jour de l’URL (image finale, souvent publique). */
  onUrlChange: (next: string) => void;
  /** Désactive l’input et les actions. */
  disabled?: boolean;
  /** Types MIME acceptés par l’input file (défaut: "image/*"). */
  accept?: string;
  /** Texte alternatif pour la preview. */
  previewAlt: string;
  /** Texte d’aide optionnel affiché sous le champ. */
  help?: string;
  /**
   * Upload optionnel :
   * reçoit le fichier sélectionné, orchestre éventuellement un pipeline async
   * (prepare/direct upload/finalize), puis retourne le média finalisé.
   */
  onFileSelect?: (file: File) => Promise<UploadedRasterImage>;
  onUploaded?: (meta: UploadedRasterImage) => void;
  /** Types MIME recommandés (hint non bloquant si différent). */
  preferredTypes?: ReadonlyArray<string>;
  /** Message affiché si le type choisi n’est pas recommandé. */
  preferredTypeHint?: string;

  /**
   * Taille maximale autorisée côté UI (en octets).
   * @example 5_000_000 pour 5 MB (doit matcher le serveur).
   */
  maxBytes?: number;

  /** Handler appelé lors d’un reset complet (URL + preview). */
  onClear?: () => void;

  /**
   * Erreur externe (ex: Zod/RHF : src requis).
   */
  invalid?: boolean;
  errorMessage?: string;

  /**
   * Mode de rendu de la preview.
   * - "fill" : (défaut) Image en `fill` + object-contain (comportement actuel)
   * - "icon" : image centrée, taille fixe (utile pour favicons)
   */
  previewMode?: ImageSelectorPreviewMode;

  /**
   * Taille (px) utilisée en mode "icon".
   * @default 128
   */
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

  // Nettoyage de l’URL blob locale à l’unmount
  useEffect(() => {
    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
      }
    };
  }, []);

  // Erreur effective : locale > externe (RHF/Zod)
  const effectiveError =
    fileError ?? (invalid ? (errorMessage ?? undefined) : undefined);

  const isInvalid = Boolean(effectiveError);

  // Construction de l’attribut aria-describedby à partir des IDs fournis
  const describedByIds: string[] = [];
  const hasHintContent = Boolean(typeHint) || Boolean(help);

  if (hintId && hasHintContent) {
    describedByIds.push(hintId);
  }

  // ✅ Important : on référence l’errorId si une erreur (locale OU externe) existe
  if (errorId && isInvalid) {
    describedByIds.push(errorId);
  }

  const describedBy =
    describedByIds.length > 0 ? describedByIds.join(" ") : undefined;

  // Nom affiché : nom choisi localement ou dernier segment de l’URL distante
  const showName = pickedName || (url ? url.split("/").pop() : "");

  // Busy UI : désactivation globale + upload en cours
  const isBusy = Boolean(uploading);
  const isSavingLocked = Boolean(disabled);
  const isLocked = Boolean(isSavingLocked || uploading);

  // Taille plus compacte (évite les gros pavés vides)
  const PREVIEW_MIN_HEIGHT = 180;

  // Désactivation du bouton de suppression : rien à supprimer (URL + preview + nom vides)
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

      // ✅ url contrôlée (string)
      onUrlChange(uploaded.url);

      // ✅ preview = URL publique (plus stable que blob)
      //setLocalPreview(uploaded.url);

      // ✅ remonte width/height au parent
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
      // 1) Validation basique : enforce MIME image/*
      if (!file.type.startsWith("image/")) {
        setFileError(t("uiErrors.notImage"));
        return;
      }

      // 1bis) Validation taille max côté UI (si fournie)
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

      // 2) Hint non bloquant sur les types recommandés
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

      // 3) Preview locale via object URL (avec cleanup)
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      blobRef.current = objectUrl;
      setLocalPreview(objectUrl);
      setPickedName(file.name);

      // 4) Upload (si callback fourni) → met à jour l’URL publique
      if (onFileSelect) {
        await doUpload(file);
      }
    } finally {
      // ✅ IMPORTANT : permet de re-sélectionner le même fichier
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
      // ✅ on se base sur l’erreur effective (locale OU externe)
      data-invalid={isInvalid ? true : undefined}
      aria-busy={isBusy || undefined}
    >
      <FieldLabel visualMode="studio" htmlFor={fieldId}>
        {label}
      </FieldLabel>

      {/* Statut a11y uniquement (pas de layout shift) */}
      {uploading && (
        <LoadingStatus
          label={t("studio.imageSelector.uploadingSr")}
          withSpinner={false}
          className="sr-only"
        />
      )}

      {/* Input file masqué (piloté via la zone cliquable) */}
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

      {/* Zone interactive : placeholder (empty) → preview (filled) */}
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

        {/* Action secondaire : supprimer, discrète, sans voler la vedette */}
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

      {/* Description / hints (types recommandés) */}
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

      {/* ✅ Erreur bloquante : locale OU externe */}
      {effectiveError && (
        <FieldError id={errorId}>
          <ErrorText error={effectiveError} />
        </FieldError>
      )}
    </Field>
  );
}

ImageSelector.displayName = "ImageSelector";
