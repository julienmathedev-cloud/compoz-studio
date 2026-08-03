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
  const requiresDecision = conflict.groups.some((group) =>
    group.items.some((item) => item.resolutionMode === "choice"),
  );

  if (!conflict.canResolve || !requiresDecision) return null;

  return (
    <ConflictResolutionPanel
      action={{ kind: "choices", onApply: conflict.apply }}
      conflictKey={conflict.conflictId}
      description={t("description")}
      error={conflict.error}
      focusTargetId={focusTargetId}
      groups={conflict.groups}
      isPending={conflict.pending}
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
      onCancel={conflict.abandon}
      title={t("title")}
    />
  );
}

SettingsConflictPanel.displayName = "SettingsConflictPanel";
