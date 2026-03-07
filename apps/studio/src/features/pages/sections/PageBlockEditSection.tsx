"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/PageBlockEditSection.tsx
 * @layer ui/studio/pages/sections
 *
 * @description
 * Section studio d’édition d’un bloc de page.
 */

import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { uploadImage } from "@compoz/infra/http/studio/media.client";
import { Button } from "@compoz/ui/components/ui/button";
import { formatBytes } from "@compoz/ui/lib/format-bytes";
import type {
  BlockShape,
  LayoutSectionBlockShape,
} from "@compoz/validation/pages/blocks/block";
import type { LayoutSectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";
import { useStudioDirtyGuard } from "@compoz/studio/features/dirty-guard/useStudioDirtyGuard";
import { LayoutSectionBlockEditorForm } from "@compoz/studio/features/pages/blocks/components/organisms/LayoutSectionBlockEditorForm";
import { useListPageBlocks } from "@compoz/studio/features/pages/blocks/hooks/useListPageBlocks";
import { useUpdateBlock } from "@compoz/studio/features/pages/blocks/hooks/useUpdateBlock";
import { useInternalPageOptions } from "@compoz/studio/features/pages/hooks/useInternalPageOptions";
import {
  normalizeLayoutSectionBlockFormValues,
  toLayoutSectionBlockFormValuesFromDTO,
} from "@compoz/studio/features/pages/mappers/blocks-form";
import { useStudioPreview } from "@compoz/studio/features/preview/hooks/useStudioPreview";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { notify } from "@compoz/studio/lib/ui/notify";
import { toLayoutSectionBlockShapeFromFormValues } from "@compoz/ui/pages/mappers/block-shape";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type PageBlockEditSectionProps = Readonly<{
  pageId: string;
  slug: string;
  blockId: string;
}>;

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const FALLBACK_INITIAL_VALUES: LayoutSectionBlockFormValues = {
  columns: 1,
  containerMode: "contained",
  titleEnabled: true,
  title: { text: "", display: "visible" },
  lcpPriority: false,
  cells: [{ kind: "richText", content: "" }],
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function PageBlockEditSection({
  pageId,
  slug,
  blockId,
}: PageBlockEditSectionProps) {
  const t = useTranslations();
  const locale = useLocale();

  const { blocks, isLoading } = useListPageBlocks(pageId);
  const { update, isUpdating, updatingBlockId } = useUpdateBlock();
  const { options: internalPageOptions } = useInternalPageOptions();

  const dirtyGuard = useStudioDirtyGuard();
  const backHref = `/${locale}/pages/${pageId}/blocks`;

  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);
  const [previewMode, setPreviewMode] = useState<"baseline" | "override">(
    "baseline",
  );
  const [liveValues, setLiveValues] =
    useState<LayoutSectionBlockFormValues | null>(null);

  const isConfirmingRef = useRef(false);
  const baselineRef = useRef<LayoutSectionBlockFormValues | null>(null);
  const prevBaselineSigRef = useRef<string | null>(null);

  const handleUploadImage = useCallback(
    async (file: File): Promise<UploadedRasterImage> => {
      const result = await uploadImage(file, "content");

      if (result.wasResized || result.wasCompressed) {
        notify.info(
          t("studio.shared.upload.optimized", {
            from: formatBytes(result.originalSize),
            to: formatBytes(result.optimizedSize),
          }),
        );
      }

      return {
        url: result.url,
        width: result.width,
        height: result.height,
      };
    },
    [t],
  );

  const block = useMemo(
    () => (blocks ?? []).find((item) => item.id === blockId) ?? null,
    [blocks, blockId],
  );

  const baseline = useMemo<LayoutSectionBlockFormValues | null>(() => {
    if (!block || block.type !== "layoutSection") return null;

    const dto = toLayoutSectionBlockFormValuesFromDTO(block);
    return normalizeLayoutSectionBlockFormValues(dto);
  }, [block]);

  const baselineSig = useMemo(() => {
    return baseline ? JSON.stringify(baseline) : "null";
  }, [baseline]);

  useEffect(() => {
    baselineRef.current = baseline;

    const previousSig = prevBaselineSigRef.current;
    prevBaselineSigRef.current = baselineSig;

    if (previousSig == null) {
      dirtyGuard.setDirty(false);
      setBlockingErrorsCount(0);
      return;
    }

    if (previousSig === baselineSig) return;

    dirtyGuard.setDirty(false);
    setBlockingErrorsCount(0);
  }, [baseline, baselineSig, dirtyGuard]);

  const isUpdatingThisBlock = updatingBlockId === blockId;

  const headingTitle = t("studio.pageBlockEditSection.section.title", {
    title:
      block?.type === "layoutSection"
        ? block.title.text.trim() || blockId
        : blockId,
    slug,
  });

  const description = t("studio.pageBlockEditSection.section.description");

  const handleBack = useCallback(async () => {
    if (isConfirmingRef.current) return;

    isConfirmingRef.current = true;

    try {
      await dirtyGuard.navigate(backHref);
    } finally {
      isConfirmingRef.current = false;
    }
  }, [backHref, dirtyGuard]);

  /* ----------------------------- Preview wiring ---------------------------- */

  const baselinePreview = useMemo<LayoutSectionBlockShape | null>(() => {
    if (!baseline) return null;

    return toLayoutSectionBlockShapeFromFormValues({
      blockId,
      values: baseline,
    });
  }, [baseline, blockId]);

  const previewScope = useMemo(
    () => `pageBlock:${slug}:${blockId}`,
    [slug, blockId],
  );

  const { setBaseline, ready, frame, iframeRef, setDraft } =
    useStudioPreview<BlockShape | null>(previewScope, baselinePreview);

  const dataReady = !isLoading;
  const isEmpty = dataReady && baseline == null;
  const emptyLabel = t("studio.emptyPreview.blocks");

  const isPreviewLoading =
    !isEmpty && (isLoading || baseline == null || !ready.isReady(previewScope));

  useEffect(() => {
    if (!baselinePreview || !ready.isReady(previewScope)) return;

    setBaseline(previewScope, baselinePreview);
    setPreviewMode("baseline");
  }, [baselinePreview, previewScope, ready, setBaseline]);

  const handlePreviewSync = useCallback(() => {
    frame.onSync();
    setPreviewMode("override");
  }, [frame]);

  const handlePreviewReset = useCallback(() => {
    frame.onReset();
    setPreviewMode("baseline");
  }, [frame]);

  /* ------------------------------- Save logic ------------------------------ */

  const handleSave = useCallback(
    async (values: LayoutSectionBlockFormValues) => {
      const pageIdKey = String(pageId ?? "").trim();
      const blockIdKey = String(blockId ?? "").trim();

      if (!pageIdKey || !blockIdKey || isUpdating) return;

      const baselineForPatch = baselineRef.current;
      if (!baselineForPatch) return;

      const normalizedNext = normalizeLayoutSectionBlockFormValues(values);

      const hasOtherLcpPriority = (blocks ?? []).some((item) => {
        if (!item || item.id === blockId) return false;
        if (item.type !== "layoutSection") return false;

        const formValues = toLayoutSectionBlockFormValuesFromDTO(item);
        return formValues.lcpPriority === true;
      });

      try {
        await update(
          pageIdKey,
          blockIdKey,
          baselineForPatch,
          normalizedNext,
          hasOtherLcpPriority,
        );

        dirtyGuard.setDirty(false);

        const nextBaselinePreview = toLayoutSectionBlockShapeFromFormValues({
          blockId,
          values: normalizedNext,
        });

        setBaseline<LayoutSectionBlockShape>(previewScope, nextBaselinePreview);
        frame.onReset();
        setPreviewMode("baseline");
      } catch {
        // no-op: notifications already handled by the hook
      }
    },
    [
      pageId,
      blockId,
      blocks,
      isUpdating,
      update,
      dirtyGuard,
      setBaseline,
      previewScope,
      frame,
    ],
  );

  /* --------------------------------- Empty -------------------------------- */

  if (!block && !isLoading) {
    return (
      <SettingsSection
        id="page-block-edit"
        title={headingTitle}
        description={description}
        isLoading={false}
        isBusy={false}
        isDirty={dirtyGuard.isDirty}
        blockingErrorsCount={blockingErrorsCount}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleBack()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("studio.pageBlockEditSection.section.back")}
        </Button>

        <EmptyState text={t("studio.pageBlockEditSection.section.notFound")} />
      </SettingsSection>
    );
  }

  /* -------------------------------- Render -------------------------------- */

  const syncDisabled =
    frame.syncDisabled || baselinePreview == null || liveValues == null;

  return (
    <SettingsSection
      id="page-block-edit"
      title={headingTitle}
      description={description}
      isBusy={isUpdatingThisBlock}
      isLoading={Boolean(isLoading)}
      isDirty={dirtyGuard.isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => void handleBack()}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("studio.pageBlockEditSection.section.back")}
      </Button>

      <LayoutSectionBlockEditorForm
        initialValues={baseline ?? FALLBACK_INITIAL_VALUES}
        isSaving={isUpdatingThisBlock}
        onSubmit={handleSave}
        onReset={() => {
          setLiveValues(null);
          dirtyGuard.setDirty(false);

          if (baselinePreview) {
            setDraft(baselinePreview);
          }

          handlePreviewReset();
        }}
        onValuesChange={(values) => {
          const next = normalizeLayoutSectionBlockFormValues(values);
          setLiveValues(next);

          setDraft(
            toLayoutSectionBlockShapeFromFormValues({ blockId, values: next }),
          );
        }}
        onDirtyChange={(isDirty) => {
          dirtyGuard.setDirty(Boolean(isDirty));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onUploadImage={handleUploadImage}
        internalPageOptions={
          internalPageOptions as ReadonlyArray<InternalPageOptionDTO>
        }
      />

      <PreviewFrame
        title={t("studio.shared.preview.title", {
          entity: t("studio.shared.entities.blocks"),
        })}
        src={`/preview/pages/${slug}/blocks/${blockId}`}
        iframeRef={iframeRef}
        onLoad={frame.onLoad}
        onSync={handlePreviewSync}
        onReset={handlePreviewReset}
        syncDisabled={syncDisabled}
        isLoading={isPreviewLoading}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        heightClassName="h-[420px]"
        info={
          isEmpty
            ? t("studio.emptyPreview.blocks")
            : previewMode === "override"
              ? t("studio.shared.preview.infoOverride")
              : t("studio.shared.preview.infoBaseline")
        }
      />
    </SettingsSection>
  );
}

PageBlockEditSection.displayName = "PageBlockEditSection";
