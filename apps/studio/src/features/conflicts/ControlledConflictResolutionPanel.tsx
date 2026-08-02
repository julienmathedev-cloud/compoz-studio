"use client";

/**
 * @file apps/studio/src/features/conflicts/ControlledConflictResolutionPanel.tsx
 * @layer studio/features/conflicts
 * @description Shared controlled interaction wrapper for Studio OCC conflicts.
 */

import { ConflictResolutionPanel } from "@compoz/studio/features/conflicts/ConflictResolutionPanel";
import {
  buildControlledConflictResolutionPolicy,
  isControlledConflictActionDisabled,
  type ControlledConflictActionId,
  type ControlledConflictResolutionController,
} from "@compoz/studio/features/conflicts/controlled-conflict-resolution";
import type { ConflictActionExecutionResult } from "@compoz/studio/features/conflicts/conflict-presentation";

type ControlledConflictPanelAction = Readonly<{
  id: string;
  label: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  disabled?: boolean;
  onClick: () => ConflictActionExecutionResult | Promise<ConflictActionExecutionResult>;
  focusAfterSuccess?: "restore-trigger" | "panel" | "target" | "none";
  focusTargetId?: string;
}>;

type ControlledConflictResolutionPanelProps = Readonly<{
  controller: ControlledConflictResolutionController;
  title: string;
  description: string;
  focusTargetId: string;
  labels: Readonly<{
    baseline: string;
    server: string;
    local: string;
    useServer: string;
    keepLocal: string;
    pending: string;
  }>;
  actionLabels: Readonly<
    Record<ControlledConflictActionId, string> & { keepLocalSimple: string }
  >;
}>;

export function ControlledConflictResolutionPanel({
  controller,
  title,
  description,
  focusTargetId,
  labels,
  actionLabels,
}: ControlledConflictResolutionPanelProps) {
  const policy = buildControlledConflictResolutionPolicy(controller);
  const actions: ControlledConflictPanelAction[] = [];
  for (const actionId of policy.actionIds) {
    switch (actionId) {
      case "abandon":
        actions.push({
          id: actionId,
          label: actionLabels[actionId],
          variant: "outline" as const,
          disabled: isControlledConflictActionDisabled(controller, actionId),
          onClick: controller.abandon,
          focusAfterSuccess: "restore-trigger" as const,
        });
        break;
      case "adopt-current":
        if (controller.adoptCurrent) actions.push({
          id: actionId,
          label: actionLabels[actionId],
          variant: "outline" as const,
          disabled: isControlledConflictActionDisabled(controller, actionId),
          onClick: controller.adoptCurrent,
          focusAfterSuccess: "target" as const,
          focusTargetId,
        });
        break;
      case "keep-all-local":
        if (controller.keepLocal) actions.push({
          id: actionId,
          label: policy.mode === "simple"
            ? actionLabels.keepLocalSimple
            : actionLabels[actionId],
          variant: policy.mode === "simple"
            ? "default" as const
            : "outline" as const,
          disabled: isControlledConflictActionDisabled(controller, actionId),
          onClick: controller.keepLocal,
          focusAfterSuccess: "target" as const,
          focusTargetId,
        });
        break;
      case "apply":
        if (controller.apply) actions.push({
          id: actionId,
          label: actionLabels[actionId],
          onClick: controller.apply,
          disabled: isControlledConflictActionDisabled(controller, actionId),
          focusAfterSuccess: "target" as const,
          focusTargetId,
        });
        break;
      case "retry-fresh-read":
        if (controller.retryFreshRead) actions.push({
          id: actionId,
          label: actionLabels[actionId],
          disabled: isControlledConflictActionDisabled(controller, actionId),
          onClick: controller.retryFreshRead,
          focusAfterSuccess: "panel" as const,
        });
        break;
    }
  }

  return (
    <ConflictResolutionPanel
      actions={actions}
      conflictId={controller.conflictId}
      description={description}
      error={controller.error}
      groups={policy.groups}
      labels={labels}
      onChoice={controller.choose}
      pending={controller.pending}
      title={title}
    />
  );
}

ControlledConflictResolutionPanel.displayName = "ControlledConflictResolutionPanel";
