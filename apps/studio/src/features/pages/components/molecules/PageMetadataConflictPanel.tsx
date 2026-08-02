"use client";

/**
 * @file apps/studio/src/features/pages/components/molecules/PageMetadataConflictPanel.tsx
 * @layer studio/features/pages/components
 * @description Field-by-field controls for resolving page metadata OCC conflicts.
 */

import { useTranslations } from "next-intl";

import { ControlledConflictResolutionPanel } from "@compoz/studio/features/conflicts/ControlledConflictResolutionPanel";
import { toPageMetadataConflictPresentation } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-presentation";
import { toPageMetadataConflictPanelController } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-panel-controller";
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
  const tChangeFrequency = useTranslations("studio.pageForm.sitemap.changefreq.options");

  return (
    <ControlledConflictResolutionPanel
      actionLabels={{
        abandon: t("actions.abandon"),
        "adopt-current": t("actions.adoptCurrent"),
        "keep-all-local": t("actions.keepAllLocal"),
        keepLocalSimple: t("actions.keepAllLocal"),
        apply: t("actions.apply"),
        "retry-fresh-read": t("actions.retryFreshRead"),
      }}
      controller={toPageMetadataConflictPanelController(
        controller,
        toPageMetadataConflictPresentation(
          controller.state,
          controller.choices,
          t,
          tChangeFrequency,
        ),
      )}
      description={t("description")}
      focusTargetId={focusTargetId}
      labels={{
        baseline: t("baseline"),
        server: t("remote"),
        local: t("local"),
        useServer: t("adoptRemote"),
        keepLocal: t("keepLocal"),
        pending: tConflict("pending"),
      }}
      title={t("title")}
    />
  );
}

PageMetadataConflictPanel.displayName = "PageMetadataConflictPanel";
