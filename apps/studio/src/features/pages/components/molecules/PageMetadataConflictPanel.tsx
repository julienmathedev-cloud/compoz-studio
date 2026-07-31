"use client";

/**
 * @file apps/studio/src/features/pages/components/molecules/PageMetadataConflictPanel.tsx
 * @layer studio/features/pages/components
 * @description Field-by-field controls for resolving page metadata OCC conflicts.
 */

import { useTranslations } from "next-intl";

import type {
  PageMetadataConflictChoice,
  PageMetadataConflictState,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import { ConflictResolutionPanel } from "@compoz/studio/features/conflicts/ConflictResolutionPanel";
import { toPageMetadataConflictPresentation } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-presentation";
import { Button } from "@compoz/ui/components/ui/button";

type PageMetadataConflictPanelProps = Readonly<{
  state: PageMetadataConflictState;
  onChoice: (
    field: PageMetadataConflictState["unresolvedFields"][number],
    choice: PageMetadataConflictChoice,
  ) => void;
}>;

export function PageMetadataConflictPanel({
  state,
  onChoice,
}: PageMetadataConflictPanelProps) {
  const t = useTranslations("studio.pageEditSection.conflict");
  const tChangeFrequency = useTranslations("studio.pageForm.sitemap.changefreq.options");

  return (
    <ConflictResolutionPanel
      conflictId={`page-metadata-${state.details.currentMetaRevision}`}
      description={state.unresolvedFields.length === 0 ? t("resolved") : t("description")}
      groups={toPageMetadataConflictPresentation(state, t, tChangeFrequency)}
      labels={{ baseline: t("baseline"), server: t("remote"), local: t("local"), useServer: t("adoptRemote"), keepLocal: t("keepLocal"), pending: t("resolved") }}
      onChoice={(field, choice) => onChoice(field as PageMetadataConflictState["unresolvedFields"][number], choice === "server" ? "adoptRemote" : "keepLocal")}
      renderItemActions={(field) => (
        <Button className="mt-3" onClick={() => onChoice(field as PageMetadataConflictState["unresolvedFields"][number], "restoreInitial")} size="sm" type="button" variant="ghost">
          {t("restoreInitial")}
        </Button>
      )}
      title={t("title")}
    />
  );
}

PageMetadataConflictPanel.displayName = "PageMetadataConflictPanel";
