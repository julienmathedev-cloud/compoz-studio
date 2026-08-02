/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-panel-controller.ts
 * @layer studio/features/settings/conflicts
 * @description Maps Settings business capabilities to the shared controlled panel contract.
 */

import type { ControlledConflictResolutionController } from "@compoz/studio/features/conflicts/controlled-conflict-resolution";
import type { SettingsConflictController } from "@compoz/studio/features/settings/hooks/useSettingsResource";

export function toSettingsConflictPanelController(
  conflict: SettingsConflictController,
): ControlledConflictResolutionController {
  return {
    ...conflict,
    canUseLocalDirectlyInSimple: conflict.canResolve,
    canKeepAllLocalInComposite: conflict.canKeepLocal,
    adoptCurrent: conflict.canResolve ? conflict.adoptCurrent : undefined,
    keepLocal: conflict.canResolve ? conflict.keepLocal : undefined,
    apply: conflict.canResolve ? conflict.apply : undefined,
    keepLocalEquivalentToApply: true,
  };
}
