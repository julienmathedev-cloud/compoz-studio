/**
 * @file apps/studio/src/features/conflicts/controlled-conflict-resolution.ts
 * @layer studio/features/conflicts
 * @description Pure interaction policy for the shared controlled OCC panel.
 */

import type {
  ConflictActionExecutionResult,
  ConflictPresentationGroup,
  ConflictResolutionChoice,
} from "@compoz/studio/features/conflicts/conflict-presentation";

export type ControlledConflictActionId =
  | "abandon"
  | "adopt-current"
  | "keep-all-local"
  | "apply"
  | "retry-fresh-read";

export type ControlledConflictResolutionMode = "simple" | "composite";

export type ControlledConflictResolutionController = Readonly<{
  conflictId: string;
  groups: readonly ConflictPresentationGroup[];
  pending: boolean;
  error?: string;
  canResolve: boolean;
  canApply: boolean;
  canUseLocalDirectlyInSimple: boolean;
  canKeepAllLocalInComposite: boolean;
  keepLocalEquivalentToApply: boolean;
  choose: (itemId: string, choice: ConflictResolutionChoice) => void;
  abandon: () => ConflictActionExecutionResult;
  adoptCurrent?: () => Promise<ConflictActionExecutionResult>;
  keepLocal?: () => Promise<ConflictActionExecutionResult>;
  apply?: () => Promise<ConflictActionExecutionResult>;
  retryFreshRead?: () => Promise<ConflictActionExecutionResult>;
}>; 

export type ControlledConflictResolutionPolicy = Readonly<{
  mode: ControlledConflictResolutionMode;
  groups: readonly ConflictPresentationGroup[];
  actionIds: readonly ControlledConflictActionId[];
}>;

export function isControlledConflictActionDisabled(
  controller: Pick<ControlledConflictResolutionController, "pending" | "canApply">,
  actionId: ControlledConflictActionId,
): boolean {
  return controller.pending || (actionId === "apply" && !controller.canApply);
}

function withoutChoiceRadios(
  groups: readonly ConflictPresentationGroup[],
): readonly ConflictPresentationGroup[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.resolutionMode === "choice"
        ? { ...item, resolutionMode: "automatic" as const }
        : item,
    ),
  }));
}

export function buildControlledConflictResolutionPolicy(
  controller: Pick<
    ControlledConflictResolutionController,
    | "groups"
    | "canResolve"
    | "canUseLocalDirectlyInSimple"
    | "canKeepAllLocalInComposite"
    | "keepLocalEquivalentToApply"
    | "adoptCurrent"
    | "keepLocal"
    | "apply"
    | "retryFreshRead"
  >,
): ControlledConflictResolutionPolicy {
  const items = controller.groups.flatMap((group) => group.items);
  const decisionConflicts = items.filter(
    (item) => item.status === "conflict" && item.resolutionMode === "choice",
  );
  const isSimple =
    controller.canResolve &&
    decisionConflicts.length === 1 &&
    items.length === 1 &&
    controller.adoptCurrent !== undefined &&
    controller.canUseLocalDirectlyInSimple &&
    controller.keepLocal !== undefined &&
    controller.keepLocalEquivalentToApply;

  if (isSimple) {
    return {
      mode: "simple",
      groups: withoutChoiceRadios(controller.groups),
      actionIds: ["abandon", "adopt-current", "keep-all-local"],
    };
  }

  if (!controller.canResolve) {
    return {
      mode: "composite",
      groups: controller.groups,
      actionIds: controller.retryFreshRead
        ? ["abandon", "retry-fresh-read"]
        : ["abandon"],
    };
  }

  return {
    mode: "composite",
    groups: controller.groups,
    actionIds: [
      "abandon",
      ...(controller.adoptCurrent ? ["adopt-current" as const] : []),
      ...(controller.canKeepAllLocalInComposite && controller.keepLocal
        ? ["keep-all-local" as const]
        : []),
      ...(controller.apply ? ["apply" as const] : []),
    ],
  };
}
