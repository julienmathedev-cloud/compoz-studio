/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict-panel-controller.ts
 * @layer studio/features/pages/conflicts
 * @description Maps page Metadata capabilities to the shared controlled panel contract.
 */

import type { ControlledConflictResolutionController } from "@compoz/studio/features/conflicts/controlled-conflict-resolution";
import type { ConflictPresentationGroup } from "@compoz/studio/features/conflicts/conflict-presentation";
import type { PageMetadataConflictController } from "@compoz/studio/features/pages/conflicts/usePageMetadataConflictController";

export function toPageMetadataConflictPanelController(
  controller: PageMetadataConflictController,
  groups: readonly ConflictPresentationGroup[],
): ControlledConflictResolutionController {
  return {
    conflictId: controller.conflictId,
    groups,
    pending: controller.pending,
    error: controller.error,
    canResolve: true,
    canApply: controller.canApply,
    canUseLocalDirectlyInSimple: true,
    canKeepAllLocalInComposite: true,
    keepLocalEquivalentToApply: true,
    choose: controller.choose,
    abandon: controller.abandon,
    adoptCurrent: controller.adoptCurrent,
    keepLocal: controller.keepLocal,
    apply: controller.apply,
  };
}
