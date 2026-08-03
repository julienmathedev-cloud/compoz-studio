"use client";

/**
 * @file apps/studio/src/features/pages/components/molecules/PageMetadataConflictPanel.tsx
 * @layer studio/features/pages/components
 * @description Field-by-field controls for resolving page metadata OCC conflicts.
 */

import { useTranslations } from "next-intl";

import { ConflictResolutionPanel } from "@compoz/studio/features/conflicts/ConflictResolutionPanel";
import { toPageMetadataConflictPresentation } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-presentation";
import type { PageMetadataConflictController } from "@compoz/studio/features/pages/conflicts/usePageMetadataConflictController";

type PageMetadataConflictPanelProps = Readonly<{
  controller: PageMetadataConflictController;
  focusTargetId: string;
}>;

export function PageMetadataConflictPanel({
  controller,
  focusTargetId,
}: PageMetadataConflictPanelProps) {
  const t = useTranslations("studio.pageEditSection.conflict");
  const tConflict = useTranslations("studio.conflictResolution");
  const tPageForm = useTranslations("studio.pageForm");
  const tChangeFrequency = useTranslations("studio.pageForm.sitemap.changefreq.options");

  return (
    <ConflictResolutionPanel
      action={{ kind: "choices", onApply: controller.apply }}
      conflictKey={controller.conflictId}
      description={t("description")}
      error={controller.error}
      focusTargetId={focusTargetId}
      groups={toPageMetadataConflictPresentation(
        controller.state,
        t,
        tChangeFrequency,
        tPageForm("title.label"),
      )}
      isPending={controller.pending}
      labels={{
        baseline: tConflict("labels.initialVersion"),
        server: tConflict("labels.savedVersion"),
        local: tConflict("labels.yourDraft"),
        useServer: tConflict("actions.useServer"),
        keepLocal: tConflict("actions.keepLocal"),
        pending: tConflict("pending"),
        cancel: tConflict("actions.cancel"),
        apply: tConflict("actions.apply"),
        orderBaseline: tConflict("labels.initialOrder"),
        orderServer: tConflict("labels.savedOrder"),
        orderLocal: tConflict("labels.yourOrder"),
        position: tConflict("labels.position"),
      }}
      onCancel={controller.abandon}
      title={t("title")}
    />
  );
}

PageMetadataConflictPanel.displayName = "PageMetadataConflictPanel";
