"use client";

/**
 * @file apps/studio/src/features/settings/conflicts/SettingsConflictPanel.tsx
 * @layer studio/features/settings/conflicts
 * @description Shared Settings wrapper around the transversal OCC resolution shell.
 */

import { useTranslations } from "next-intl";

import { ConflictResolutionPanel } from "@compoz/studio/features/conflicts/ConflictResolutionPanel";
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
    <ConflictResolutionPanel
      actions={[
        {
          id: "abandon",
          label: t("actions.abandon"),
          variant: "outline",
          onClick: conflict.abandon,
          focusAfterSuccess: "restore-trigger",
        },
        ...(conflict.canResolve ? [{
          id: "adopt-current",
          label: t("actions.adoptCurrent"),
          variant: "outline" as const,
          onClick: conflict.adoptCurrent,
          focusAfterSuccess: "target" as const,
          focusTargetId,
        }, ...(conflict.canKeepLocal ? [{
          id: "keep-all-local",
          label: t("actions.keepAllLocal"),
          variant: "outline" as const,
          onClick: conflict.keepLocal,
          focusAfterSuccess: "target" as const,
          focusTargetId,
        }] : []), {
          id: "apply",
          label: t("actions.apply"),
          onClick: conflict.apply,
          disabled: !conflict.canApply,
          focusAfterSuccess: "target" as const,
          focusTargetId,
        }] : [{
          id: "retry-fresh-read",
          label: t("actions.retryFreshRead"),
          onClick: conflict.retryFreshRead,
          focusAfterSuccess: "panel" as const,
        }]),
      ]}
      conflictId={conflict.conflictId}
      description={t("description")}
      error={conflict.error}
      groups={conflict.groups}
      labels={{
        baseline: t("labels.baseline"),
        server: t("labels.server"),
        local: t("labels.local"),
        useServer: t("actions.useServer"),
        keepLocal: t("actions.keepLocal"),
        pending: tConflict("pending"),
      }}
      onChoice={conflict.choose}
      pending={conflict.pending}
      title={t("title")}
    />
  );
}

SettingsConflictPanel.displayName = "SettingsConflictPanel";
