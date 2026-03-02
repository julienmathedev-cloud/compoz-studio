"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/PageBlockEditSection.tsx
 * @layer ui/sections
 */

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { Button } from "@compoz/ui/components/ui/button";
import { formatBytes } from "@compoz/ui/lib/format-bytes";
import { toLayoutSectionBlockShapeFromFormValues } from "@compoz/ui/pages/mappers/block-shape";
import type {
  BlockShape,
  LayoutSectionBlockShape,
} from "@compoz/validation/pages/blocks/block";
import type { LayoutSectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";
import { useAdminDirtyGuard } from "@compoz/studio/features/dirty-guard/useAdminDirtyGuard";
import { LayoutSectionBlockEditorForm } from "@compoz/studio/features/pages/blocks/components/organisms/LayoutSectionBlockEditorForm";
import { useListPageBlocks } from "@compoz/studio/features/pages/blocks/hooks/useListPageBlocks";
import { useUpdateBlock } from "@compoz/studio/features/pages/blocks/hooks/useUpdateBlock";
import { useInternalPageOptions } from "@compoz/studio/features/pages/hooks/useInternalPageOptions";
import {
  normalizeLayoutSectionBlockFormValues,
  toLayoutSectionBlockFormValuesFromDTO,
} from "@compoz/studio/features/pages/mappers/blocks-form";
import { useAdminPreview } from "@compoz/studio/features/preview/hooks/useAdminPreview";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { notify } from "@compoz/studio/lib/ui/notify";
import { uploadImage } from "@compoz/infra/http/studio/media.client";
import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

  // ✅ Dirty state (navigation guard)
  const dirtyGuard = useAdminDirtyGuard();

  const backHref = `/${locale}/dashboard/pages/${pageId}/blocks`;

  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  // Anti double-confirm (clics rapides)
  const isConfirmingRef = useRef(false);

  const onUploadImage = useCallback(
    async (file: File): Promise<UploadedRasterImage> => {
      const res = await uploadImage(file, "content");

      if (res.wasResized || res.wasCompressed) {
        notify.info(
          t("admin.shared.upload.optimized", {
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

  const block = useMemo(
    () => (blocks ?? []).find((b) => b.id === blockId) ?? null,
    [blocks, blockId],
  );

  /**
   * ✅ internalPageOptions : via hook SoT (plus de mapping local depuis useReadSiteIndex)
   */
  const { options: internalPageOptions } = useInternalPageOptions();

  /**
   * Ref = uniquement pour le patch/diff (pas de lecture pendant render).
   */
  const baselineRef = useRef<LayoutSectionBlockFormValues | null>(null);

  const [previewMode, setPreviewMode] = useState<"baseline" | "override">(
    "baseline",
  );

  /**
   * Live values (preview) : piloté par onValuesChange du form.
   */
  const [liveValues, setLiveValues] =
    useState<LayoutSectionBlockFormValues | null>(null);

  /**
   * Baseline (form) calculée (pure) à partir du block.
   */
  const baseline = useMemo<LayoutSectionBlockFormValues | null>(() => {
    if (!block) return null;
    if (block.type !== "layoutSection") return null;

    const d = toLayoutSectionBlockFormValuesFromDTO(block);
    return normalizeLayoutSectionBlockFormValues(d);
  }, [block]);

  /**
   * Signature (valeur) de la baseline pour éviter les resets "dirty"
   * lorsque la baseline change uniquement de référence (refetch/remap).
   *
   * Note : pour V0.5, JSON.stringify est acceptable (baseline généralement petite).
   */
  const baselineSig = useMemo(() => {
    return baseline ? JSON.stringify(baseline) : "null";
  }, [baseline]);

  const prevBaselineSigRef = useRef<string | null>(null);

  /**
   * Sync du ref vers la baseline calculée.
   * On ne reset le dirty que si la baseline a réellement changé en contenu.
   */
  useEffect(() => {
    baselineRef.current = baseline;

    const prev = prevBaselineSigRef.current;
    prevBaselineSigRef.current = baselineSig;

    // 1er passage : on initialise proprement
    if (prev == null) {
      dirtyGuard.setDirty(false);
      setBlockingErrorsCount(0);
      return;
    }

    // Baseline inchangée en contenu => ne touche pas au dirty
    if (prev === baselineSig) return;

    // Baseline réellement différente (ex: invalidation après save / autre block)
    dirtyGuard.setDirty(false);
    setBlockingErrorsCount(0);
  }, [baseline, baselineSig, dirtyGuard]);

  const isThisBusy = updatingBlockId === blockId;

  const headingTitle = t("admin.pageBlockEditSection.section.title", {
    title:
      block?.type === "layoutSection"
        ? block.title.text.trim() || blockId
        : blockId,
    slug,
  });

  const description = t("admin.pageBlockEditSection.section.description");

  // ✅ Back avec dirty guard
  const handleBack = useCallback(async () => {
    if (isConfirmingRef.current) return;
    isConfirmingRef.current = true;

    try {
      await dirtyGuard.navigate(backHref);
    } finally {
      isConfirmingRef.current = false;
    }
  }, [backHref, dirtyGuard]);

  /**
   * Form fallback (UI-only)
   */
  const fallbackInitialValues = useMemo<LayoutSectionBlockFormValues>(
    () => ({
      columns: 1,
      containerMode: "contained",

      // ✅ NEW
      titleEnabled: true,
      title: { text: "", display: "visible" },
      lcpPriority: false,
      cells: [{ kind: "richText", content: "" }],
    }),
    [],
  );

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
    useAdminPreview<BlockShape | null>(previewScope, baselinePreview);

  /**
   * ✅ Empty preview (iframe) :
   * - On ne l’active qu’une fois les données chargées.
   * - Si la baseline est absente => l’iframe affiche un empty state.
   */
  const dataReady = !isLoading;
  const isEmpty = dataReady && baseline == null;
  const emptyLabel = t("admin.emptyPreview.blocks");

  // ✅ si empty => pas de loader bloquant
  const isPreviewLoading =
    !isEmpty && (isLoading || baseline == null || !ready.isReady(previewScope));

  useEffect(() => {
    if (!baselinePreview) return;
    if (!ready.isReady(previewScope)) return;

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
      const pageIdKey = (pageId ?? "").trim();
      const blockIdKey = (blockId ?? "").trim();
      if (!pageIdKey || !blockIdKey) return;
      if (isUpdating) return;

      const baselineForPatch = baselineRef.current;
      if (!baselineForPatch) return;

      const normalizedNext = normalizeLayoutSectionBlockFormValues(values);
      const hasOtherLcpPriority = (blocks ?? []).some((b) => {
        if (!b || b.id === blockId) return false;
        if (b.type !== "layoutSection") return false;

        // ✅ lit la valeur via ton mapper (SoT DTO -> form values)
        const fv = toLayoutSectionBlockFormValuesFromDTO(b);
        return fv.lcpPriority === true;
      });

      try {
        await update(
          pageIdKey,
          blockIdKey,
          baselineForPatch,
          normalizedNext,
          hasOtherLcpPriority,
        );

        // ✅ On ne met "propre" qu’après succès
        dirtyGuard.setDirty(false);
        const nextBaselinePreview = toLayoutSectionBlockShapeFromFormValues({
          blockId,
          values: normalizedNext,
        });
        setBaseline<LayoutSectionBlockShape>(previewScope, nextBaselinePreview);
        frame.onReset();
        setPreviewMode("baseline");
      } catch {
        // ✅ on laisse le state tel quel si erreur (notify déjà géré dans le hook)
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
          {t("admin.pageBlockEditSection.section.back")}
        </Button>

        <EmptyState text={t("admin.pageBlockEditSection.section.notFound")} />
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
      isBusy={isThisBusy}
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
        {t("admin.pageBlockEditSection.section.back")}
      </Button>

      <LayoutSectionBlockEditorForm
        initialValues={baseline ?? fallbackInitialValues}
        isSaving={isThisBusy}
        onSubmit={handleSave}
        onReset={() => {
          setLiveValues(null);
          dirtyGuard.setDirty(false);

          if (baselinePreview) setDraft(baselinePreview);
          handlePreviewReset();
        }}
        onValuesChange={(v) => {
          const next = normalizeLayoutSectionBlockFormValues(v);
          setLiveValues(next);

          setDraft(
            toLayoutSectionBlockShapeFromFormValues({ blockId, values: next }),
          );
        }}
        onDirtyChange={(isDirty) => {
          dirtyGuard.setDirty(Boolean(isDirty));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onUploadImage={onUploadImage}
        internalPageOptions={
          internalPageOptions as ReadonlyArray<InternalPageOptionDTO>
        }
      />

      <PreviewFrame
        title={t("admin.shared.preview.title", {
          entity: t("admin.shared.entities.blocks"),
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
            ? t("admin.emptyPreview.blocks")
            : previewMode === "override"
              ? t("admin.shared.preview.infoOverride")
              : t("admin.shared.preview.infoBaseline")
        }
      />
    </SettingsSection>
  );
}

PageBlockEditSection.displayName = "PageBlockEditSection";
