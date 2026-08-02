"use client";

/**
 * @file apps/studio/src/features/settings/conflicts/SettingsConflictPanel.tsx
 * @layer studio/features/settings/conflicts
 * @description Shared Settings wrapper around the transversal OCC resolution shell.
 */

import { useTranslations } from "next-intl";

import { ControlledConflictResolutionPanel } from "@compoz/studio/features/conflicts/ControlledConflictResolutionPanel";
import { toSettingsConflictPanelController } from "@compoz/studio/features/settings/conflicts/settings-conflict-panel-controller";
import type { SettingsConflictController } from "@compoz/studio/features/settings/hooks/useSettingsResource";

type SettingsConflictPanelProps = Readonly<{
  conflict: SettingsConflictController;
  focusTargetId: string;
}>;

export function SettingsConflictPanel({
  conflict,
  focusTargetId,
}: SettingsConflictPanelProps) {
  const t = useTranslations("studio.settingsConflict");
  const tConflict = useTranslations("studio.conflictResolution");

  return (
    <ControlledConflictResolutionPanel
      actionLabels={{
        abandon: t("actions.abandon"),
        "adopt-current": t("actions.adoptCurrent"),
        "keep-all-local": t("actions.keepAllLocal"),
        keepLocalSimple: t("actions.keepLocalAndSave"),
        apply: t("actions.apply"),
        "retry-fresh-read": t("actions.retryFreshRead"),
      }}
      controller={toSettingsConflictPanelController(conflict)}
      description={t("description")}
      focusTargetId={focusTargetId}
      labels={{
        baseline: t("labels.baseline"),
        server: t("labels.server"),
        local: t("labels.local"),
        useServer: t("actions.useServer"),
        keepLocal: t("actions.keepLocal"),
        pending: tConflict("pending"),
      }}
      title={t("title")}
    />
  );
}

SettingsConflictPanel.displayName = "SettingsConflictPanel";
