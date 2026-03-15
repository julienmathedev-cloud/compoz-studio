"use client";

/**
 * @file apps/studio/src/features/builder/BuilderScreen.tsx
 * @layer ui/studio/builder
 *
 * @description
 * Écran client principal du builder Studio.
 *
 * @remarks
 * - Orchestrateur principal du builder.
 * - Gère la baseline dérivée des props, la preview et la sélection de cell.
 * - Réplique la logique métier de l’ancienne édition :
 *   dirty guard, baseline ref, vrai save via hook, sync preview.
 * - Passe explicitement les objets RHF utiles aux sous-composants.
 * - Évite la duplication props -> state pour la baseline afin de rester
 *   aligné avec l’ancien fonctionnement et éviter les cascades de rendu.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormSetValue,
} from "react-hook-form";
import { useForm, useFormState, useWatch } from "react-hook-form";

import { uploadImage } from "@compoz/infra/http/studio/media.client";
import { log } from "@compoz/infra/lib/log";
import {
  SectionFormStatusBadge,
  type SectionFormStatusKind,
} from "@compoz/studio/components/atoms/badges/SectionFormStatusBadge";
import { BuilderCellDrawer } from "@compoz/studio/features/builder/BuilderCellDrawer";
import { BuilderSidebar } from "@compoz/studio/features/builder/BuilderSidebar";
import { useStudioDirtyGuard } from "@compoz/studio/features/dirty-guard/useStudioDirtyGuard";
import { useListPageBlocks } from "@compoz/studio/features/pages/blocks/hooks/useListPageBlocks";
import { useUpdateBlock } from "@compoz/studio/features/pages/blocks/hooks/useUpdateBlock";
import {
  normalizeSectionBlockFormValues,
  toSectionBlockFormValuesFromDTO,
} from "@compoz/studio/features/pages/mappers/blocks-form";
import { useStudioPreview } from "@compoz/studio/features/preview/hooks/useStudioPreview";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { Header } from "@compoz/studio/features/shell/components/Header";
import { notify } from "@compoz/studio/lib/ui/notify";
import { formatBytes } from "@compoz/ui/lib/format-bytes";
import { cn } from "@compoz/ui/lib/utils";
import { toSectionBlockShapeFromFormValues } from "@compoz/ui/pages/mappers/block-shape";
import { STUDIO_CONTAINER, STUDIO_PAGE } from "@compoz/ui/styles/studio/layout";
import type {
  BlockShape,
  SectionBlockShape,
} from "@compoz/validation/pages/blocks/block";
import {
  SectionBlockFormSchema,
  type SectionBlockFormValues,
} from "@compoz/validation/pages/blocks/block-form";

const lg = log.child({ ns: "studio", scope: "BuilderScreen" });

function countBlockingErrors(value: unknown): number {
  if (!value) return 0;

  if (Array.isArray(value)) {
    return value.reduce((acc, item) => acc + countBlockingErrors(item), 0);
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    if (typeof obj.message === "string" && obj.message.trim().length > 0) {
      return 1;
    }

    let total = 0;
    for (const key of Object.keys(obj)) {
      total += countBlockingErrors(obj[key]);
    }
    return total;
  }

  return 0;
}

type SelectedCellLocation = Readonly<{
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
  rowId: string;
  columnId: string;
  cellId: string;
}>;

function findSelectedCellLocation(
  values: SectionBlockFormValues,
  selectedCellId: string | undefined,
): SelectedCellLocation | null {
  if (!selectedCellId) return null;

  for (let rowIndex = 0; rowIndex < values.rows.length; rowIndex++) {
    const row = values.rows[rowIndex];

    for (let columnIndex = 0; columnIndex < row.columns.length; columnIndex++) {
      const column = row.columns[columnIndex];

      for (let cellIndex = 0; cellIndex < column.cells.length; cellIndex++) {
        const cell = column.cells[cellIndex];

        if (cell.id === selectedCellId) {
          return {
            rowIndex,
            columnIndex,
            cellIndex,
            rowId: row.id,
            columnId: column.id,
            cellId: cell.id,
          };
        }
      }
    }
  }

  return null;
}

type BuilderScreenProps = Readonly<{
  pageId: string;
  pageSlug: string;
  blockId: string;
  initialValues: SectionBlockFormValues;
}>;

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

export function BuilderScreen({
  pageId,
  pageSlug,
  blockId,
  initialValues,
}: BuilderScreenProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dirtyGuard = useStudioDirtyGuard();

  const { blocks } = useListPageBlocks(pageId);
  const { update, isUpdating, updatingBlockId } = useUpdateBlock();

  const backHref = `/${locale}/pages/${pageId}/blocks`;
  const previewSrc = `/preview/pages/${pageSlug}/blocks/${blockId}`;

  const [previewMode, setPreviewMode] = useState<"baseline" | "override">(
    "baseline",
  );
  const [selectedCellId, setSelectedCellId] = useState<string | undefined>();

  const baseline = useMemo<SectionBlockFormValues>(() => {
    return normalizeSectionBlockFormValues(initialValues);
  }, [initialValues]);

  const baselineSig = useMemo(() => {
    return JSON.stringify(baseline);
  }, [baseline]);

  const baselineRef = useRef<SectionBlockFormValues | null>(null);
  const prevBaselineSigRef = useRef<string | null>(null);
  const lastBaselinePreviewSigRef = useRef<string | null>(null);
  const lastDraftPreviewSigRef = useRef<string | null>(null);
  const hasLoggedPreviewReadyRef = useRef(false);

  const form = useForm<SectionBlockFormValues>({
    resolver: zodResolver(SectionBlockFormSchema),
    defaultValues: baseline,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });

  const { control, handleSubmit, reset, setValue, clearErrors, trigger } = form;
  const { isDirty, isSubmitting, errors } = useFormState({ control });

  const watchedAll = useWatch({ control }) as
    | SectionBlockFormValues
    | undefined;

  const liveValues = useMemo<SectionBlockFormValues>(() => {
    return normalizeSectionBlockFormValues(watchedAll ?? baseline);
  }, [watchedAll, baseline]);

  const liveValuesSig = useMemo(() => {
    return JSON.stringify(liveValues);
  }, [liveValues]);

  const blockingErrorsCount = useMemo(() => {
    return countBlockingErrors(errors);
  }, [errors]);

  const onUploadImage = useCallback(
    async (file: File): Promise<UploadedRasterImage> => {
      const res = await uploadImage(file, "content");

      if (res.wasResized || res.wasCompressed) {
        notify.info(
          t("studio.shared.upload.optimized", {
            from: formatBytes(res.originalSize),
            to: formatBytes(res.optimizedSize),
          }),
        );
      }

      return {
        url: res.url,
        width: res.width,
        height: res.height,
      };
    },
    [t],
  );

  const previewScope = useMemo(
    () => `pageBlock:${pageSlug}:${blockId}`,
    [pageSlug, blockId],
  );

  const baselinePreview = useMemo<SectionBlockShape | null>(() => {
    return toSectionBlockShapeFromFormValues({
      blockId,
      values: baseline,
    });
  }, [baseline, blockId]);

  const baselinePreviewSig = useMemo(() => {
    return baselinePreview ? JSON.stringify(baselinePreview) : "null";
  }, [baselinePreview]);

  const draftPreview = useMemo<SectionBlockShape | null>(() => {
    return toSectionBlockShapeFromFormValues({
      blockId,
      values: liveValues,
    });
  }, [blockId, liveValues]);

  const draftPreviewSig = useMemo(() => {
    return draftPreview ? JSON.stringify(draftPreview) : "null";
  }, [draftPreview]);

  const { setBaseline, ready, frame, iframeRef, setDraft } =
    useStudioPreview<BlockShape | null>(previewScope, baselinePreview);

  const isPreviewReady = ready.isReady(previewScope);
  const isEmpty = baselinePreview == null;
  const emptyLabel = t("studio.emptyPreview.blocks");
  const isPreviewLoading = !isEmpty && !isPreviewReady;

  useEffect(() => {
    lg.info("mount", { pageId, pageSlug, blockId });

    return () => {
      lg.info("unmount", { pageId, pageSlug, blockId });
    };
  }, [pageId, pageSlug, blockId]);

  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  useEffect(() => {
    const prevSig = prevBaselineSigRef.current;
    prevBaselineSigRef.current = baselineSig;

    if (prevSig == null) return;
    if (prevSig === baselineSig) return;

    lg.info("baseline.sync.from-props", {
      blockId,
      previousSig: prevSig,
      nextSig: baselineSig,
    });

    reset(baseline, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });

    lastBaselinePreviewSigRef.current = null;
    lastDraftPreviewSigRef.current = null;
    hasLoggedPreviewReadyRef.current = false;
  }, [baseline, baselineSig, blockId, reset]);

  useEffect(() => {
    dirtyGuard.setDirty(Boolean(isDirty));
  }, [dirtyGuard, isDirty]);

  useEffect(() => {
    if (!isPreviewReady) return;
    if (hasLoggedPreviewReadyRef.current) return;

    hasLoggedPreviewReadyRef.current = true;

    lg.info("preview.ready", {
      blockId,
      previewScope,
    });
  }, [blockId, isPreviewReady, previewScope]);

  useEffect(() => {
    if (!baselinePreview) return;
    if (!isPreviewReady) return;
    if (lastBaselinePreviewSigRef.current === baselinePreviewSig) return;

    lastBaselinePreviewSigRef.current = baselinePreviewSig;

    lg.info("preview.baseline.push", {
      blockId,
      previewScope,
      baselineSig,
    });

    setBaseline(previewScope, baselinePreview);
  }, [
    baselinePreview,
    baselinePreviewSig,
    baselineSig,
    blockId,
    isPreviewReady,
    previewScope,
    setBaseline,
  ]);

  useEffect(() => {
    if (!isPreviewReady) return;
    if (lastDraftPreviewSigRef.current === draftPreviewSig) return;

    lastDraftPreviewSigRef.current = draftPreviewSig;

    lg.info("preview.draft.push", {
      blockId,
      previewScope,
      isDirty,
      liveValuesSig,
    });

    setDraft(draftPreview);
  }, [
    blockId,
    draftPreview,
    draftPreviewSig,
    isDirty,
    isPreviewReady,
    liveValuesSig,
    previewScope,
    setDraft,
  ]);

  const handleBack = useCallback(async () => {
    await dirtyGuard.navigate(backHref);
  }, [backHref, dirtyGuard]);

  const handlePreviewSync = useCallback(() => {
    lg.info("preview.sync", { blockId, previewScope });
    frame.onSync();
    setPreviewMode("override");
  }, [blockId, frame, previewScope]);

  const handlePreviewReset = useCallback(() => {
    lg.info("preview.reset", { blockId, previewScope });
    frame.onReset();
    setPreviewMode("baseline");
  }, [blockId, frame, previewScope]);

  const handleSave = useCallback(
    async (values: SectionBlockFormValues) => {
      const pageIdKey = String(pageId ?? "").trim();
      const blockIdKey = String(blockId ?? "").trim();

      if (!pageIdKey || !blockIdKey) return;
      if (isUpdating) return;

      const baselineForPatch = baselineRef.current;
      if (!baselineForPatch) {
        lg.warn("save.skip.no-baseline-ref", { blockId: blockIdKey });
        return;
      }

      const normalizedNext = normalizeSectionBlockFormValues(values);

      const hasOtherLcpPriority = (blocks ?? []).some((block) => {
        if (!block || block.id === blockIdKey) return false;
        if (block.type !== "section") return false;

        const formValues = toSectionBlockFormValuesFromDTO(block);
        return formValues.lcpPriority === true;
      });

      lg.info("save.start", {
        pageId: pageIdKey,
        blockId: blockIdKey,
        hasOtherLcpPriority,
      });

      try {
        await update(
          pageIdKey,
          blockIdKey,
          baselineForPatch,
          normalizedNext,
          hasOtherLcpPriority,
        );

        lg.info("save.success", {
          pageId: pageIdKey,
          blockId: blockIdKey,
        });

        baselineRef.current = normalizedNext;

        reset(normalizedNext, {
          keepDirty: false,
          keepTouched: false,
          keepErrors: false,
        });

        dirtyGuard.setDirty(false);

        const nextBaselinePreview = toSectionBlockShapeFromFormValues({
          blockId,
          values: normalizedNext,
        });

        const nextBaselinePreviewSig = JSON.stringify(nextBaselinePreview);

        lastBaselinePreviewSigRef.current = nextBaselinePreviewSig;
        lastDraftPreviewSigRef.current = nextBaselinePreviewSig;

        setBaseline<SectionBlockShape>(previewScope, nextBaselinePreview);
        setDraft(nextBaselinePreview);
        frame.onReset();
        setPreviewMode("baseline");
      } catch (error) {
        lg.error("save.failed", {
          pageId: pageIdKey,
          blockId: blockIdKey,
          msg: String(error),
        });
      }
    },
    [
      blockId,
      blocks,
      dirtyGuard,
      frame,
      isUpdating,
      pageId,
      previewScope,
      reset,
      setBaseline,
      setDraft,
      update,
    ],
  );

  const handleInvalidSubmit = useCallback(
    (submitErrors: FieldErrors<SectionBlockFormValues>) => {
      lg.error("form.submit.invalid", {
        blockId,
        errorKeys: Object.keys(submitErrors ?? {}),
        hasName: Boolean(submitErrors?.name),
        hasRows: Boolean(submitErrors?.rows),
        hasContainerMode: Boolean(submitErrors?.containerMode),
        hasLcpPriority: Boolean(submitErrors?.lcpPriority),
      });
    },
    [blockId],
  );

  const handleFormSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();

      await handleSubmit(handleSave, handleInvalidSubmit)(event);
    },
    [handleInvalidSubmit, handleSave, handleSubmit],
  );

  const handleReset = useCallback(() => {
    lg.info("form.reset", { blockId });

    reset(baseline, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });

    dirtyGuard.setDirty(false);
    setSelectedCellId(undefined);

    if (baselinePreview) {
      const sig = JSON.stringify(baselinePreview);
      lastDraftPreviewSigRef.current = sig;
      setDraft(baselinePreview);
    }

    frame.onReset();
    setPreviewMode("baseline");
  }, [baseline, baselinePreview, blockId, dirtyGuard, frame, reset, setDraft]);

  const selectedCellLocation = useMemo(() => {
    return findSelectedCellLocation(liveValues, selectedCellId);
  }, [liveValues, selectedCellId]);

  const effectiveSelectedCellId = selectedCellLocation?.cellId;

  const syncDisabled =
    frame.syncDisabled || baselinePreview == null || !isDirty;

  const isUpdatingThisBlock = updatingBlockId === blockId;

  const headerStatusKind = useMemo<SectionFormStatusKind>(() => {
    if (isUpdatingThisBlock || isSubmitting) return "saving";
    if (blockingErrorsCount > 0) return "error";
    if (isDirty) return "modified";
    return "saved";
  }, [blockingErrorsCount, isDirty, isSubmitting, isUpdatingThisBlock]);

  return (
    <form
      aria-busy={isSubmitting || isUpdatingThisBlock || undefined}
      onSubmit={handleFormSubmit}
      noValidate
      className="flex min-h-0 min-w-0 flex-1"
    >
      <aside className="shrink-0">
        <BuilderSidebar
          control={control as Control<SectionBlockFormValues>}
          setValue={setValue as UseFormSetValue<SectionBlockFormValues>}
          clearErrors={
            clearErrors as UseFormClearErrors<SectionBlockFormValues>
          }
          isSaving={isUpdatingThisBlock}
          isDirty={isDirty}
          selectedCellId={effectiveSelectedCellId}
          onSelectCell={setSelectedCellId}
          onReset={handleReset}
          onBack={handleBack}
        />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-sidebar pl-2">
        <Header
          leftSlot={
            <SectionFormStatusBadge
              kind={headerStatusKind}
              count={headerStatusKind === "error" ? blockingErrorsCount : 0}
            />
          }
        />

        <div
          id="main"
          className="mb-2 mr-2 flex-1 overflow-y-auto rounded-sm border border-primary/10 bg-background"
          tabIndex={-1}
        >
          <div className={cn(STUDIO_CONTAINER)}>
            <div className={cn(STUDIO_PAGE)}>
              <PreviewFrame
                title={t("studio.builder.preview.frame.title")}
                src={previewSrc}
                iframeRef={iframeRef}
                onLoad={frame.onLoad}
                onSync={handlePreviewSync}
                onReset={handlePreviewReset}
                syncDisabled={syncDisabled}
                isLoading={isPreviewLoading}
                isEmpty={isEmpty}
                emptyLabel={emptyLabel}
                heightClassName="h-[630px]"
                info={
                  isEmpty
                    ? t("studio.emptyPreview.blocks")
                    : previewMode === "override"
                      ? t("studio.shared.preview.infoOverride")
                      : t("studio.shared.preview.infoBaseline")
                }
                deviceMode="compact"
                fitMode="responsive"
              />
            </div>
          </div>
        </div>
      </div>

      <BuilderCellDrawer
        control={control}
        setValue={setValue}
        clearErrors={clearErrors}
        trigger={trigger}
        open={Boolean(selectedCellLocation)}
        selectedCellLocation={selectedCellLocation}
        onUploadImage={onUploadImage}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCellId(undefined);
            handlePreviewSync();
          }
        }}
      />
    </form>
  );
}

BuilderScreen.displayName = "BuilderScreen";
