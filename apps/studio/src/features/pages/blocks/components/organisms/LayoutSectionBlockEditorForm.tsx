"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/LayoutSectionBlockEditorForm.tsx
 * @layer ui/studio/pages/blocks/editor
 *
 * @description
 * Form RHF+Zod pour éditer un block LayoutSection (header + cells).
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo } from "react";
import type { FieldErrors } from "react-hook-form";
import {
  useController,
  useForm,
  useFormState,
  useWatch,
} from "react-hook-form";

import { Card, CardContent, CardFooter } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";

import { ActionsBar } from "@compoz/studio/components/molecules/controls/ActionsBar";
import type { CellErrorByIndex } from "@compoz/studio/features/pages/blocks/editor/CellEditorTabs";
import { CellEditorTabs } from "@compoz/studio/features/pages/blocks/editor/CellEditorTabs";
import { PageBlockEditHeader } from "@compoz/studio/features/pages/blocks/editor/PageBlockEditHeader";

import { notify } from "@compoz/studio/lib/ui/notify";
import { focusByFieldId } from "@compoz/ui/lib/focus";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";

import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";
import { useStableOnValuesChange } from "@compoz/ui/hooks/useStableOnValuesChange";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { createEmptyCell } from "@compoz/studio/features/pages/mappers/cells-form";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import {
  LayoutSectionBlockFormSchema,
  type LayoutSectionBlockFormValues,
} from "@compoz/validation/pages/blocks/block-form";
import type {
  CarouselCellFormValues,
  CellFormValues,
  GalleryCellFormValues,
  ImageCellFormValues,
  RichTextCellFormValues,
} from "@compoz/validation/pages/blocks/cells/cell-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type LayoutSectionBlockEditorFormProps = Readonly<{
  initialValues: LayoutSectionBlockFormValues;
  isSaving?: boolean;

  onSubmit: (values: LayoutSectionBlockFormValues) => void | Promise<void>;

  onReset?: () => void;
  onValuesChange?: (values: LayoutSectionBlockFormValues) => void;
  onDirtyChange?: (dirty: boolean) => void;

  /**
   * Remonte le nombre d’erreurs bloquantes (issues RHF/Zod) pour badges/headers.
   *
   * @remarks
   * V0.5 : on compte toutes les erreurs “leaf” présentes dans `formState.errors`
   * (header + cells + items imbriqués). C’est volontairement global et robuste.
   */
  onBlockingErrorsCountChange?: (count: number) => void;

  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;

  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
}>;

function withNullableTitle(
  values: LayoutSectionBlockFormValues,
): LayoutSectionBlockFormValues {
  return { ...values, title: values.title ?? null };
}

function hasMeaningfulRichTextContent(html: string): boolean {
  if (!html) return false;

  // Supprime toutes les balises HTML
  const text = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  return text.length > 0;
}

/**
 * Détermine si une cell “contient quelque chose”.
 *
 * @remarks
 * V0.5 : heuristique volontairement simple.
 * - RichText : content non vide
 * - Autres : string non vide / array non vide / object non vide / truthy
 */
function hasMeaningfulCellContent(cell: CellFormValues): boolean {
  if (!cell || typeof cell !== "object") return false;

  const kind = cell.kind as string | undefined;

  if (kind === "richText") {
    return hasMeaningfulRichTextContent(
      (cell as RichTextCellFormValues).content ?? "",
    );
  }

  if (kind === "image") {
    const img = (cell as ImageCellFormValues).image;
    return String(img?.src ?? "").trim().length > 0;
  }

  if (kind === "gallery") {
    const images = (cell as GalleryCellFormValues).images ?? [];
    const first = images[0];
    return images.length > 1 || String(first?.src ?? "").trim().length > 0;
  }

  if (kind === "carousel") {
    const images = (cell as CarouselCellFormValues).images ?? [];
    const first = images[0];
    return images.length > 1 || String(first?.src ?? "").trim().length > 0;
  }

  return false;
}

/**
 * Indique si réduire les colonnes provoquerait une perte de contenu (cells hors range).
 */
function wouldLoseContentOnColumnsReduce(args: {
  currentColumns: number;
  nextColumns: number;
  cells: ReadonlyArray<CellFormValues>;
}): boolean {
  const { currentColumns, nextColumns, cells } = args;

  if (nextColumns >= currentColumns) return false;

  const removed = cells.slice(nextColumns);
  return removed.some((c) => hasMeaningfulCellContent(c));
}

/**
 * Indique si changer de type de cellule provoquerait une perte de contenu (cells hors range).
 */
function wouldLoseContentOnCellKindChange(args: {
  current: CellFormValues | undefined;
  nextKind: CellFormValues["kind"];
}): boolean {
  const { current, nextKind } = args;
  if (!current) return false;
  if (current.kind === nextKind) return false;
  return hasMeaningfulCellContent(current);
}

/**
 * Compte le nombre d’erreurs “leaf” dans un objet `errors` RHF.
 *
 * @remarks
 * - Une leaf est un objet contenant une propriété `message` (erreur RHF).
 * - Les arrays/objets sont parcourus récursivement.
 * - Couvre naturellement : header + cells + structures imbriquées.
 */
function countBlockingErrors(value: unknown): number {
  if (!value) return 0;

  if (Array.isArray(value)) {
    return value.reduce((acc, v) => acc + countBlockingErrors(v), 0);
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    // “Leaf” RHF typique : { type, message, ref }
    if (typeof obj.message === "string" && obj.message.trim().length > 0) {
      return 1;
    }

    let total = 0;
    for (const k of Object.keys(obj)) {
      total += countBlockingErrors(obj[k]);
    }
    return total;
  }

  return 0;
}

/* -------------------------------------------------------------------------- */
/* Helpers (no any)                                                           */
/* -------------------------------------------------------------------------- */

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getProp(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function readMessage(value: unknown): string | undefined {
  const msg = getProp(value, "message");
  return typeof msg === "string" && msg.trim().length > 0 ? msg : undefined;
}

function readId(value: unknown): string | undefined {
  const id = getProp(value, "id");
  return typeof id === "string" && id.trim().length > 0 ? id : undefined;
}

function readListImages(value: unknown): ReadonlyArray<{ id: string }> | null {
  if (!isRecord(value)) return null;
  const imagesRaw = getProp(value, "images");
  if (!Array.isArray(imagesRaw)) return null;

  const out: Array<{ id: string }> = [];
  for (const item of imagesRaw) {
    const id = readId(item);
    if (!id) continue;
    out.push({ id });
  }
  return out;
}

function getListImageLength(cell: CellFormValues | undefined): number {
  if (!cell) return 0;

  // ✅ évite un crash TS/JS si `images` existe mais n'est pas un array
  return "images" in cell && Array.isArray(cell.images)
    ? cell.images.length
    : 0;
}

function toCellArray(value: unknown): CellFormValues[] {
  // ✅ évite un crash runtime : Array.from({}) => TypeError (not iterable)
  if (!Array.isArray(value)) return [];
  // On suppose que RHF stocke déjà la bonne shape (car contrôlé par ton schema)
  return value as CellFormValues[];
}

export function LayoutSectionBlockEditorForm({
  initialValues,
  isSaving,
  onSubmit,
  onReset,
  onValuesChange,
  onDirtyChange,
  onBlockingErrorsCountChange,
  onUploadImage,
  internalPageOptions,
}: LayoutSectionBlockEditorFormProps) {
  const t = useTranslations();
  const confirmList = useConfirmList();

  const destructiveConfirmLabels = useMemo(
    () => ({
      title: t("studio.shared.confirm.destructiveChange.title"),
      intro: t("studio.shared.confirm.destructiveChange.intro"),
      confirmLabel: t("studio.shared.confirm.destructiveChange.confirmLabel"),
      cancelLabel: t("studio.shared.confirm.destructiveChange.cancelLabel"),
      requireAckLabel: t(
        "studio.shared.confirm.destructiveChange.requireAckLabel",
      ),
    }),
    [t],
  );

  const normalizedInitialValues = useMemo(() => {
    return withNullableTitle(initialValues);
  }, [initialValues]);

  const {
    control,
    handleSubmit,
    reset: rhfReset,
    setValue,
    clearErrors,
  } = useForm<LayoutSectionBlockFormValues>({
    resolver: zodResolver(LayoutSectionBlockFormSchema),
    defaultValues: normalizedInitialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });

  const { isDirty, isSubmitting, submitCount, touchedFields, errors } =
    useFormState({
      control,
    });

  const isBusy = Boolean(isSaving || isSubmitting);

  useEffect(() => {
    onDirtyChange?.(Boolean(isDirty));
  }, [isDirty, onDirtyChange]);

  // ✅ Remonte un compteur global d’erreurs bloquantes (badge header/section).
  const blockingErrorsCount = countBlockingErrors(errors);

  useEffect(() => {
    onBlockingErrorsCountChange?.(blockingErrorsCount);
  }, [blockingErrorsCount, onBlockingErrorsCountChange]);

  useEffect(() => {
    rhfReset(normalizedInitialValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });

    // Reset “safe” : on repart à 0 erreurs remontées côté parent.
    onBlockingErrorsCountChange?.(0);
  }, [normalizedInitialValues, rhfReset, onBlockingErrorsCountChange]);

  // Valeurs live (pour preview draft / parent sync)
  const watchedAll = useWatch({ control }) as
    | LayoutSectionBlockFormValues
    | undefined;

  const liveValues = useMemo<LayoutSectionBlockFormValues>(() => {
    return withNullableTitle(watchedAll ?? normalizedInitialValues);
  }, [watchedAll, normalizedInitialValues]);

  useStableOnValuesChange(liveValues, onValuesChange);

  // Champs simples
  const columnsCtrl = useController({ name: "columns", control });
  const cellsCtrl = useController({ name: "cells", control });
  const containerModeCtrl = useController({ name: "containerMode", control });
  const lcpPriorityCtrl = useController({ name: "lcpPriority", control });

  // Champs imbriqués (crucial pour touched + errors en mode onBlur)
  const titleEnabledCtrl = useController({ name: "titleEnabled", control });
  const titleCtrl = useController({ name: "title", control });

  const idPrefix = useIdPrefix("page-block-edit-header");
  const titleTextIds = createFieldIds(idPrefix, "blockTitle");

  const titleEnabled = Boolean(titleEnabledCtrl.field.value);

  const titleTextTouched = typeof touchedFields.title === "object";
  const shouldShowTitleTextError =
    titleEnabled && (titleTextTouched || submitCount > 0);

  const titleTextErrorMessage =
    shouldShowTitleTextError && errors.title?.text?.message
      ? String(errors.title.text.message)
      : undefined;

  const askConfirmDestructiveChange = useCallback(async () => {
    return confirmList({
      ...destructiveConfirmLabels,
      items: [],
      tone: "default",
    });
  }, [confirmList, destructiveConfirmLabels]);

  function onSubmitValid(values: LayoutSectionBlockFormValues) {
    return onSubmit(withNullableTitle(values));
  }

  function onSubmitInvalid(
    formErrors: FieldErrors<LayoutSectionBlockFormValues>,
  ) {
    notify.error(t("uiErrors.formHasErrors"));

    // Priorité simple : titre, puis le reste (si tu veux étendre plus tard)
    if (formErrors.title?.text) {
      focusByFieldId(titleTextIds.fieldId);
    }
  }

  const submit = handleSubmit(onSubmitValid, onSubmitInvalid);

  /**
   * Guard : confirmation si réduction de colonnes -> perte de contenu.
   */
  const handleColumnsChange = useCallback(
    async (next: number) => {
      if (isBusy) return;

      const currentColumns = Number(columnsCtrl.field.value ?? 1);
      const rawCells = cellsCtrl.field.value;
      const cells = toCellArray(rawCells);

      if (!Number.isFinite(next)) return;
      if (next === currentColumns) return;

      const isDestructive =
        isDirty &&
        wouldLoseContentOnColumnsReduce({
          currentColumns,
          nextColumns: next,
          cells,
        });

      if (isDestructive) {
        const ok = await askConfirmDestructiveChange();
        if (!ok) return;
      }

      // ✅ Applique columns
      columnsCtrl.field.onChange(next);

      // ✅ Ajuste cells (truncate / extend)
      const nextCells = cells.slice(0, next);
      while (nextCells.length < next) {
        nextCells.push(createEmptyCell("richText"));
      }

      // ✅ purge erreurs des cellules supprimées (hors range)
      for (let i = next; i < cells.length; i++) {
        clearErrors(`cells.${i}` as const);
      }

      cellsCtrl.field.onChange(nextCells);
    },
    [
      askConfirmDestructiveChange,
      cellsCtrl.field,
      clearErrors,
      columnsCtrl.field,
      isDirty,
      isBusy,
    ],
  );

  const handleCellKindChange = useCallback(
    async (args: { index: number; nextKind: CellFormValues["kind"] }) => {
      if (isBusy) return;

      const { index, nextKind } = args;

      const rawCells = cellsCtrl.field.value;
      const cells = toCellArray(rawCells);

      const current = cells[index];

      const isDestructive =
        isDirty &&
        wouldLoseContentOnCellKindChange({
          current,
          nextKind,
        });

      if (isDestructive) {
        const ok = await askConfirmDestructiveChange();
        if (!ok) return;
      }

      const nextCell = createEmptyCell(nextKind);

      const nextCells = cells.slice();
      nextCells[index] = nextCell;

      // ✅ IMPORTANT : purge erreurs RHF de l’ancienne structure de cell
      clearErrors(`cells.${index}` as const);

      setValue("cells", nextCells, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false, // 👈 clé : évite l’erreur instant
      });
    },
    [
      askConfirmDestructiveChange,
      cellsCtrl.field,
      clearErrors,
      isDirty,
      isBusy,
      setValue,
    ],
  );

  /**
   * Handler centralisé : update cells sans revalidation RHF immédiate
   * + purge d’erreurs ciblée pour éviter “contamination” après submit.
   *
   * @remarks
   * - Si le `kind` change : purge toute la cell.
   * - Si une gallery change de longueur : purge `cells.i.images` (indices RHF changent).
   */
  const handleCellsChange = useCallback(
    (next: ReadonlyArray<CellFormValues>) => {
      const arr = Array.from(next);

      const prev = toCellArray(cellsCtrl.field.value);

      const max = Math.max(prev.length, arr.length);

      for (let i = 0; i < max; i++) {
        const p = prev[i];
        const n = arr[i];

        if (!p || !n) continue;

        // kind change => l’arbre de champs change totalement
        if (p.kind !== n.kind) {
          clearErrors(`cells.${i}` as const);
          continue;
        }

        // gallery length change => erreurs indexées (images[0], images[1]...) deviennent fausses
        if (n.kind === "gallery" || n.kind === "carousel") {
          const prevLen = getListImageLength(p);
          const nextLen = getListImageLength(n);

          if (prevLen !== nextLen) {
            clearErrors(`cells.${i}.images` as const);
            continue;
          }

          // bonus “safe” : si ids changent sans longueur changer (cas edge)
          const prevIds =
            readListImages(p)
              ?.map((x) => x.id)
              .join("|") ?? "";
          const nextIds =
            readListImages(n)
              ?.map((x) => x.id)
              .join("|") ?? "";
          if (prevIds !== nextIds) {
            clearErrors(`cells.${i}.images` as const);
          }
        }
      }

      setValue("cells", arr, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      });
    },
    [cellsCtrl.field.value, clearErrors, setValue],
  );

  const cellErrorsByIndex = useMemo(() => {
    const out: CellErrorByIndex = {};

    const cellsErrors = errors.cells;
    const cellsValues = cellsCtrl.field.value;

    if (!Array.isArray(cellsErrors) || !Array.isArray(cellsValues)) return out;

    cellsErrors.forEach((err, i) => {
      if (!isRecord(err)) return;

      const cell = cellsValues[i] as CellFormValues | undefined;
      const kind = cell?.kind;
      if (kind === "image") {
        const imageErr = getProp(err, "image");

        const srcMsg = readMessage(getProp(imageErr, "src"));
        const altMsg = readMessage(getProp(imageErr, "alt"));

        // ✅ NEW : width/height (crucial depuis la règle Zod)
        const widthMsg = readMessage(getProp(imageErr, "width"));
        const heightMsg = readMessage(getProp(imageErr, "height"));

        if (srcMsg || altMsg || widthMsg || heightMsg) {
          out[i] = {
            kind: "image",
            image: {
              src: srcMsg,
              alt: altMsg,
              width: widthMsg,
              height: heightMsg,
            },
          };
        }
        return;
      }

      if (kind === "gallery" || kind === "carousel") {
        const imagesErrorsRaw = getProp(err, "images");
        const imagesErrors = Array.isArray(imagesErrorsRaw)
          ? (imagesErrorsRaw as ReadonlyArray<unknown>)
          : undefined;

        const imagesValues = Array.isArray(cell?.images)
          ? (cell.images as ReadonlyArray<unknown>)
          : undefined;

        if (!imagesErrors || !imagesValues) return;

        const imagesById: Record<string, { src?: string; alt?: string }> = {};

        imagesErrors.forEach((imgErr, j) => {
          if (!isRecord(imgErr)) return;

          const imgVal = imagesValues[j];
          const id = readId(imgVal);
          if (!id) return;

          const widthMsg = readMessage(getProp(imgErr, "width"));
          const heightMsg = readMessage(getProp(imgErr, "height"));

          const srcMsgRaw = readMessage(getProp(imgErr, "src"));
          const altMsg = readMessage(getProp(imgErr, "alt"));

          // ✅ fallback : les erreurs “dims” doivent être visibles même si src est présent
          const srcMsg = srcMsgRaw ?? widthMsg ?? heightMsg;

          if (srcMsg || altMsg) imagesById[id] = { src: srcMsg, alt: altMsg };
        });

        if (Object.keys(imagesById).length > 0) {
          out[i] =
            kind === "carousel"
              ? { kind: "carousel", imagesById }
              : { kind: "gallery", imagesById };
        }
      }
    });

    return out;
  }, [errors.cells, cellsCtrl.field.value]);

  const showCellErrors = submitCount > 0;

  return (
    <form aria-busy={isBusy || undefined} onSubmit={submit} noValidate>
      <Card variant="panel">
        <CardContent className={cn(STACK_MD)}>
          <PageBlockEditHeader
            idPrefix={idPrefix}
            title={titleCtrl.field.value}
            titleEnabled={titleEnabled}
            columns={columnsCtrl.field.value}
            disabled={isBusy}
            onTitleToggle={(enabled) => {
              if (isBusy) return;

              titleEnabledCtrl.field.onChange(Boolean(enabled));

              // ✅ UX : si on désactive, on masque l’erreur du titre (mais on garde la valeur)
              if (!enabled) {
                clearErrors("title");
              }
            }}
            onTitleTextChange={(val) => {
              const current = titleCtrl.field.value;
              titleCtrl.field.onChange({
                ...current,
                text: val,
              });
            }}
            onTitleTextBlur={() => {
              titleCtrl.field.onBlur();
            }}
            onTitleDisplayChange={(val) => {
              const current = titleCtrl.field.value;
              titleCtrl.field.onChange({
                ...current,
                display: val,
              });
            }}
            containerMode={containerModeCtrl.field.value}
            onContainerModeChange={(next) => {
              containerModeCtrl.field.onChange(next);
            }}
            lcpPriority={Boolean(lcpPriorityCtrl.field.value)}
            onLcpPriorityChange={(next) => {
              if (isBusy) return;
              lcpPriorityCtrl.field.onChange(Boolean(next));
            }}
            titleTextError={titleTextErrorMessage}
            titleTextInvalid={Boolean(titleTextErrorMessage)}
            onColumnsChange={(next) => void handleColumnsChange(next)}
          />

          <Separator />

          <CellEditorTabs
            columns={columnsCtrl.field.value}
            cells={cellsCtrl.field.value}
            disabled={isBusy}
            onCellsChange={handleCellsChange}
            onCellKindChange={(args) => void handleCellKindChange(args)}
            onUploadImage={onUploadImage}
            showErrors={showCellErrors}
            errorsByIndex={cellErrorsByIndex}
            internalPageOptions={internalPageOptions}
          />
        </CardContent>

        <CardFooter>
          <ActionsBar
            variant="resetSubmit"
            isSaving={isSaving || isSubmitting}
            isDirty={isDirty}
            onReset={() => {
              rhfReset(normalizedInitialValues, {
                keepDirty: false,
                keepTouched: false,
                keepErrors: false,
              });
              onBlockingErrorsCountChange?.(0);
              onReset?.();
            }}
          />
        </CardFooter>
      </Card>
    </form>
  );
}

LayoutSectionBlockEditorForm.displayName = "LayoutSectionBlockEditorForm";
