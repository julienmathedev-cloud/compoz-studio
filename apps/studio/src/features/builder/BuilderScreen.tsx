"use client";

/**
 * @file apps/studio/src/features/builder/BuilderScreen.tsx
 * @layer studio/features/builder
 *
 * @description
 * Main client screen for the Studio block builder.
 *
 * @remarks
 * - Orchestrates RHF state, derived baseline values, preview state, and selected cell state.
 * - Keeps the builder in manual preview mode (`liveEnabled: false`) to avoid continuous iframe syncs while editing in the drawer.
 * - Triggers preview sync explicitly after drawer close and after save.
 * - Stores the validation-ready baseline in a ref so save mutations can build patches against the latest persisted value.
 * - Passes RHF helpers explicitly to child components instead of relying on nested form context.
 * - Avoids duplicating props into state for the baseline to stay aligned with the previous editor behavior and prevent render cascades.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Control,
  FieldErrors,
  Resolver,
  UseFormClearErrors,
  UseFormSetValue,
} from "react-hook-form";
import { useForm, useFormState, useWatch } from "react-hook-form";

import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import { uploadImage } from "@compoz/infra/http/studio/media.client";
import { log } from "@compoz/infra/lib/log";
import {
  SectionFormStatusBadge,
  type SectionFormStatusKind,
} from "@compoz/studio/components/atoms/badges/SectionFormStatusBadge";
import { BuilderCellDrawer } from "@compoz/studio/features/builder/BuilderCellDrawer";
import { runBuilderBlockRecreation } from "@compoz/studio/features/builder/builder-block-recreation";
import {
  type BuilderBlockBaseline,
  resolveBuilderMutationBaseline,
  resolveBuilderSnapshotRebase,
} from "@compoz/studio/features/builder/block-baseline";
import { BuilderSidebar } from "@compoz/studio/features/builder/BuilderSidebar";
import { useStudioDirtyGuard } from "@compoz/studio/features/dirty-guard/useStudioDirtyGuard";
import { useListPageBlocks } from "@compoz/studio/features/pages/blocks/hooks/useListPageBlocks";
import { useCreateBlock } from "@compoz/studio/features/pages/blocks/hooks/useCreateBlock";
import { useUpdateBlock } from "@compoz/studio/features/pages/blocks/hooks/useUpdateBlock";
import { BlockUpdateConflictPanel } from "@compoz/studio/features/pages/blocks/conflicts/BlockUpdateConflictPanel";
import { BlockListConflictPanel } from "@compoz/studio/features/pages/blocks/conflicts/BlockListConflictPanel";
import {
  resolveBlockConflictCandidate,
  type BlockConflictChoice,
} from "@compoz/studio/features/pages/blocks/conflicts/resolve-block-conflict";
import {
  normalizeSectionBlockFormValues,
  normalizeSectionBlockFormValuesForValidation,
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
  initialPersistedBlock: BlockDTO;
  initialValues: SectionBlockFormValues;
  initialBlocksRevision: number;
  initialLcpPriorityBlockId: string | null;
  isAdmin: boolean;
}>;

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
  mediaAssetId?: string;
}>;

export function BuilderScreen({
  pageId,
  pageSlug,
  blockId,
  initialPersistedBlock,
  initialValues,
  initialBlocksRevision,
  initialLcpPriorityBlockId,
  isAdmin,
}: BuilderScreenProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const dirtyGuard = useStudioDirtyGuard();

  const { blocks, blocksRevision } = useListPageBlocks(pageId);
  const {
    update,
    isUpdating,
    updatingBlockId,
    conflict: updateConflict,
    clearConflict: clearUpdateConflict,
  } = useUpdateBlock(pageId);
  const {
    create: recreateBlock,
    conflict: recreateConflict,
    clearConflict: clearRecreateConflict,
    isCreating,
  } = useCreateBlock(pageId);

  const backHref = `/${locale}/pages/${pageId}/blocks`;
  const previewSrc = `/preview/pages/${pageSlug}/blocks/${blockId}`;

  const [selectedCellId, setSelectedCellId] = useState<string | undefined>();
  const [hoveredCellId, setHoveredCellId] = useState<string | undefined>();

  const initialBaseline = useMemo<SectionBlockFormValues>(() => {
    return normalizeSectionBlockFormValues(initialValues);
  }, [initialValues]);
  const [baseline, setBaselineValues] =
    useState<SectionBlockFormValues>(initialBaseline);

  const baselineSig = useMemo(() => {
    return JSON.stringify(baseline);
  }, [baseline]);

  const baselineRef = useRef<BuilderBlockBaseline>({
    persistedBlock: initialPersistedBlock,
    formValues: initialBaseline,
    blocksRevision: initialBlocksRevision,
    lcpPriorityBlockId: initialLcpPriorityBlockId,
  });
  const prevBaselineSigRef = useRef<string | null>(null);
  const lastBaselinePreviewSigRef = useRef<string | null>(null);
  const lastDraftPreviewSigRef = useRef<string | null>(null);
  const hasLoggedPreviewReadyRef = useRef(false);

  const resolver = useCallback<Resolver<SectionBlockFormValues>>(
    async (values, context, options) => {
      const normalizedValues =
        normalizeSectionBlockFormValuesForValidation(values);

      const result = await zodResolver(SectionBlockFormSchema)(
        normalizedValues,
        context,
        options,
      );

      return result;
    },
    [],
  );

  const form = useForm<SectionBlockFormValues>({
    resolver,
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
        mediaAssetId: res.mediaAssetId,
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
      values: normalizeSectionBlockFormValuesForValidation(baseline),
    });
  }, [baseline, blockId]);

  const baselinePreviewSig = useMemo(() => {
    return baselinePreview ? JSON.stringify(baselinePreview) : "null";
  }, [baselinePreview]);

  const draftPreview = useMemo<SectionBlockShape | null>(() => {
    return toSectionBlockShapeFromFormValues({
      blockId,
      values: normalizeSectionBlockFormValuesForValidation(liveValues),
    });
  }, [blockId, liveValues]);

  const draftPreviewSig = useMemo(() => {
    return draftPreview ? JSON.stringify(draftPreview) : "null";
  }, [draftPreview]);

  const selectedCellLocation = useMemo(() => {
    return findSelectedCellLocation(liveValues, selectedCellId);
  }, [liveValues, selectedCellId]);

  const isDrawerOpen = Boolean(selectedCellLocation);

  const { setBaseline, ready, frame, iframeRef, setDraft } =
    useStudioPreview<BlockShape | null>(previewScope, {
      baseline: baselinePreview,
      liveEnabled: !isDrawerOpen,
    });

  const isPreviewReady = ready.isReady(previewScope);
  const isEmpty = baselinePreview == null;
  const emptyLabel = t("studio.emptyPreview.blocks");
  const isPreviewLoading = !isEmpty && !isPreviewReady;

  useEffect(() => {
    lg.debug("mount", { pageId, pageSlug, blockId });

    return () => {
      lg.debug("unmount", { pageId, pageSlug, blockId });
    };
  }, [pageId, pageSlug, blockId]);

  useEffect(() => {
    const prevSig = prevBaselineSigRef.current;
    prevBaselineSigRef.current = baselineSig;

    if (prevSig == null) return;
    if (prevSig === baselineSig) return;

    lg.debug("baseline.sync.from-props", {
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
    const rebase = resolveBuilderSnapshotRebase({
      snapshot: { blocks, blocksRevision },
      baselineRevision: baselineRef.current.blocksRevision,
      blockId,
      isDirty,
    });
    if (!rebase) return;
    const nextBaseline = rebase.formValues;
    baselineRef.current = rebase;
    setBaselineValues(nextBaseline);
    reset(nextBaseline, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });
  }, [blockId, blocks, blocksRevision, isDirty, reset]);

  useEffect(() => {
    if (!isPreviewReady) return;
    if (hasLoggedPreviewReadyRef.current) return;

    hasLoggedPreviewReadyRef.current = true;

    lg.debug("preview.ready", {
      blockId,
      previewScope,
    });
  }, [blockId, isPreviewReady, previewScope]);

  useEffect(() => {
    if (!baselinePreview) return;
    if (!isPreviewReady) return;
    if (lastBaselinePreviewSigRef.current === baselinePreviewSig) return;

    lastBaselinePreviewSigRef.current = baselinePreviewSig;

    lg.debug("preview.baseline.push", {
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

  /**
   * In builder mode, keep the draft cached locally while `liveEnabled: false`
   * prevents automatic iframe sync. Explicit sync happens on drawer close or save.
   */
  useEffect(() => {
    if (lastDraftPreviewSigRef.current === draftPreviewSig) return;

    lastDraftPreviewSigRef.current = draftPreviewSig;

    lg.debug("preview.draft.cache", {
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
    liveValuesSig,
    previewScope,
    setDraft,
  ]);

  /**
   * Synchronizes the selected sidebar cell hover into the preview iframe.
   *
   * @remarks
   * - Relies on preview DOM wrappers exposing `data-cell-id="<id>"`.
   * - Adds or removes `data-builder-hovered`, which preview CSS can target.
   * - Requires same-origin access, satisfied by the Studio `/preview/...` route.
   */
  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;

    if (!iframe || !doc) return;

    const previous = doc.querySelectorAll<HTMLElement>(
      "[data-builder-hovered='true']",
    );

    previous.forEach((node) => {
      node.removeAttribute("data-builder-hovered");
      node.style.outline = "";
      node.style.outlineOffset = "";
      node.style.borderRadius = "";
      node.style.boxShadow = "";
      node.style.transition = "";
      node.style.backgroundColor = "";
    });

    if (!hoveredCellId) return;

    const target = doc.querySelector<HTMLElement>(
      `[data-cell-id="${hoveredCellId}"]`,
    );

    if (!target) return;

    target.setAttribute("data-builder-hovered", "true");
    target.style.borderRadius = "12px";
    target.style.boxShadow = "0 0 0 1px var(--primary)";
    target.style.backgroundColor = "var(--secondary)";
    target.style.transition = "all 150ms ease";
  }, [hoveredCellId, iframeRef, draftPreviewSig, baselinePreviewSig]);

  const handleBack = useCallback(async () => {
    await dirtyGuard.navigate(backHref);
  }, [backHref, dirtyGuard]);

  const handleSave = useCallback(
    async (values: SectionBlockFormValues) => {
      const pageIdKey = String(pageId ?? "").trim();
      const blockIdKey = String(blockId ?? "").trim();

      if (!pageIdKey || !blockIdKey) return;
      if (isUpdating) return;

      const baselineForPatch = baselineRef.current;

      const normalizedNextForm = normalizeSectionBlockFormValues(values);
      const normalizedNextForValidation =
        normalizeSectionBlockFormValuesForValidation(values);

      const hasOtherLcpPriority = (blocks ?? []).some((block) => {
        if (!block || block.id === blockIdKey) return false;
        if (block.type !== "section") return false;

        const formValues = toSectionBlockFormValuesFromDTO(block);
        return formValues.lcpPriority === true;
      });

      lg.debug("save.start", {
        pageId: pageIdKey,
        blockId: blockIdKey,
        hasOtherLcpPriority,
      });

      try {
        const response = await update({
          blockId: blockIdKey,
          baselineBlock: baselineForPatch.persistedBlock,
          local: normalizedNextForValidation,
          expectedBlocksRevision: baselineForPatch.blocksRevision,
          baselineLcpPriorityBlockId: baselineForPatch.lcpPriorityBlockId,
        });

        lg.debug("save.success", {
          pageId: pageIdKey,
          blockId: blockIdKey,
        });

        const savedBaselineResult = resolveBuilderMutationBaseline({
          response,
          blockId: blockIdKey,
        });
        const savedValues = savedBaselineResult
          ? savedBaselineResult.formValues
          : normalizedNextForm;
        const savedBaseline =
          normalizeSectionBlockFormValuesForValidation(savedValues);

        if (savedBaselineResult) {
          baselineRef.current = savedBaselineResult;
        }
        setBaselineValues(savedValues);

        reset(savedValues, {
          keepDirty: false,
          keepTouched: false,
          keepErrors: false,
        });

        dirtyGuard.setDirty(false);

        const nextBaselinePreview = toSectionBlockShapeFromFormValues({
          blockId,
          values: savedBaseline,
        });

        const nextBaselinePreviewSig = JSON.stringify(nextBaselinePreview);

        lastBaselinePreviewSigRef.current = nextBaselinePreviewSig;
        lastDraftPreviewSigRef.current = nextBaselinePreviewSig;

        setBaseline<SectionBlockShape>(previewScope, nextBaselinePreview);
        setDraft(nextBaselinePreview);

        /**
         * After save, update the preview baseline and explicitly push the current
         * override so the iframe reflects persisted content immediately.
         */
        frame.onSync();
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
    lg.debug("form.reset", { blockId });

    const fallbackBaseline =
      normalizeSectionBlockFormValuesForValidation(baseline);
    const nextBaselineForValidation =
      baselineRef.current.formValues ?? fallbackBaseline;
    const nextBaselineForm = normalizeSectionBlockFormValues(
      nextBaselineForValidation,
    );

    reset(nextBaselineForm, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });

    dirtyGuard.setDirty(false);
    setSelectedCellId(undefined);
    setHoveredCellId(undefined);

    const nextBaselinePreview = toSectionBlockShapeFromFormValues({
      blockId,
      values: nextBaselineForValidation,
    });

    if (nextBaselinePreview) {
      const sig = JSON.stringify(nextBaselinePreview);
      lastDraftPreviewSigRef.current = sig;
      setDraft(nextBaselinePreview);
      setBaseline(previewScope, nextBaselinePreview);
    }

    /** Manual preview reset removes the current override and returns to baseline. */
    frame.onReset();
  }, [
    baseline,
    blockId,
    dirtyGuard,
    frame,
    previewScope,
    reset,
    setBaseline,
    setDraft,
  ]);

  const effectiveSelectedCellId = selectedCellLocation?.cellId;

  const isUpdatingThisBlock = updatingBlockId === blockId;

  const headerStatusKind = useMemo<SectionFormStatusKind>(() => {
    if (isUpdatingThisBlock || isSubmitting) return "saving";
    if (blockingErrorsCount > 0) return "error";
    if (isDirty) return "modified";
    return "saved";
  }, [blockingErrorsCount, isDirty, isSubmitting, isUpdatingThisBlock]);

  const handleDrawerOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        return;
      }

      setSelectedCellId(undefined);

      /**
       * Explicit drawer-close sync keeps the preview feeling near-live without
       * pushing continuous updates while the user edits fields.
       */
      frame.onSync();
    },
    [frame],
  );

  const handleResolveBlockConflict = useCallback(
    async (choices: Readonly<Record<number, BlockConflictChoice>>) => {
      if (!updateConflict) return;
      const currentBlock = updateConflict.current.blocks.find(
        (block) => block.id === blockId,
      );
      const candidate = resolveBlockConflictCandidate({
        details: updateConflict,
        choices,
      });
      if (!currentBlock || !candidate) return;

      const candidateValues = toSectionBlockFormValuesFromDTO(candidate);
      const response = await update({
        blockId,
        baselineBlock: currentBlock,
        local: candidateValues,
        expectedBlocksRevision: updateConflict.currentBlocksRevision,
        baselineLcpPriorityBlockId:
          updateConflict.current.blocks.find((block) => block.lcpPriority)?.id ??
          null,
      });
      const saved = response.blocks.find((block) => block.id === blockId);
      if (!saved) return;
      const savedValues = toSectionBlockFormValuesFromDTO(saved);
      const savedBaseline = resolveBuilderMutationBaseline({
        response,
        blockId,
      });
      if (!savedBaseline) return;
      baselineRef.current = savedBaseline;
      setBaselineValues(savedValues);
      reset(savedValues, {
        keepDirty: false,
        keepTouched: false,
        keepErrors: false,
      });
      dirtyGuard.setDirty(false);
      clearUpdateConflict();
    },
    [
      blockId,
      clearUpdateConflict,
      dirtyGuard,
      reset,
      update,
      updateConflict,
    ],
  );

  const handleAdoptCurrentSnapshot = useCallback(() => {
    if (!updateConflict) return;
    const currentBaseline = resolveBuilderMutationBaseline({
      response: updateConflict.current,
      blockId,
    });
    if (!currentBaseline) return;
    baselineRef.current = currentBaseline;
    setBaselineValues(currentBaseline.formValues);
    reset(currentBaseline.formValues, {
      keepDirty: false,
      keepTouched: false,
      keepErrors: false,
    });
    dirtyGuard.setDirty(false);
    clearUpdateConflict();
  }, [blockId, clearUpdateConflict, dirtyGuard, reset, updateConflict]);

  const handleRecreateBlock = useCallback(
    () =>
      runBuilderBlockRecreation({
        values: liveValues,
        create: recreateBlock,
        onSuccess: (createdBlockId) => {
          clearUpdateConflict();
          clearRecreateConflict();
          dirtyGuard.setDirty(false);
          router.push(
            `/${locale}/pages/${pageId}/builder/${createdBlockId}`,
          );
        },
      }),
    [
      clearRecreateConflict,
      clearUpdateConflict,
      dirtyGuard,
      liveValues,
      locale,
      pageId,
      recreateBlock,
      router,
    ],
  );

  return (
    <>
      {recreateConflict ? (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-5xl">
          <BlockListConflictPanel
            baselineBlocks={blocks}
            details={recreateConflict}
            isPending={isCreating}
            onCancel={clearRecreateConflict}
            onUseCurrent={() => {
              clearRecreateConflict();
              clearUpdateConflict();
              dirtyGuard.setDirty(false);
              router.push(backHref);
            }}
            onKeepLocal={handleRecreateBlock}
          />
        </div>
      ) : updateConflict ? (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-5xl">
          <BlockUpdateConflictPanel
            details={updateConflict}
            onCancel={clearUpdateConflict}
            onResolve={handleResolveBlockConflict}
            onAdoptCurrent={handleAdoptCurrentSnapshot}
            onAbandon={() => {
              clearUpdateConflict();
              router.push(backHref);
            }}
            onRecreate={handleRecreateBlock}
          />
        </div>
      ) : null}
    <form
      aria-busy={
        isSubmitting || isUpdatingThisBlock || isCreating || undefined
      }
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
          isAdmin={isAdmin}
          isSaving={isUpdatingThisBlock}
          isDirty={isDirty}
          selectedCellId={effectiveSelectedCellId}
          onSelectCell={setSelectedCellId}
          onHoverCell={setHoveredCellId}
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
          className="mb-2 mr-2 h-full flex-1 overflow-y-auto rounded-sm border border-primary/10 bg-background"
          tabIndex={-1}
        >
          <div className={cn(STUDIO_CONTAINER, "h-full")}>
            <div className={cn(STUDIO_PAGE)}>
              <PreviewFrame
                title={t("studio.builder.preview.frame.title")}
                src={previewSrc}
                iframeRef={iframeRef}
                onLoad={frame.onLoad}
                isLoading={isPreviewLoading}
                isEmpty={isEmpty}
                emptyLabel={emptyLabel}
                heightClassName="h-[78vh]"
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
        isAdmin={isAdmin}
        selectedCellLocation={selectedCellLocation}
        onUploadImage={onUploadImage}
        onOpenChange={handleDrawerOpenChange}
      />
    </form>
    </>
  );
}

BuilderScreen.displayName = "BuilderScreen";
