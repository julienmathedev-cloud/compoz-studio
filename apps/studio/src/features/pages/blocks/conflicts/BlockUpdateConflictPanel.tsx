"use client";

/**
 * @file apps/studio/src/features/pages/blocks/conflicts/BlockUpdateConflictPanel.tsx
 * @layer studio/features/pages/blocks/conflicts
 * @description Block-update adapter for the shared OCC resolution panel.
 */

import { useTranslations } from "next-intl";

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import {
  ConflictResolutionPanel,
  type ConflictResolutionChoices,
  type ConflictResolutionPanelAction,
} from "@compoz/studio/features/conflicts/ConflictResolutionPanel";
import {
  CONFLICT_ACTION_ERROR,
  CONFLICT_ACTION_SUCCESS,
  type ConflictActionExecutionResult,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  getBlockConflictPresentationId,
  selectBlockConflictPanelScenario,
  toBlockConflictPresentation,
} from "@compoz/studio/features/pages/blocks/conflicts/block-conflict-presentation";
import { executeBlockUpdateConflictChoice } from "@compoz/studio/features/pages/blocks/conflicts/block-update-conflict-actions";
import type { BlockConflictChoice } from "@compoz/studio/features/pages/blocks/conflicts/resolve-block-conflict";

type BlockUpdateConflictPanelProps = Readonly<{
  details: PageBlocksConflictDetails;
  onCancel: () => void;
  onResolve: (
    choices: Readonly<Record<number, BlockConflictChoice>>,
  ) => void | Promise<void>;
  onAbandon?: () => void;
  onRecreate?: () => void | Promise<void>;
  onDeleteExplicit?: () => void | Promise<void>;
  onAdoptCurrent?: () => void;
  onRetryDraft?: () => void | Promise<void>;
  baselineBlocks?: readonly Block[];
}>;

async function complete(
  action: (() => void | Promise<void>) | undefined,
): Promise<ConflictActionExecutionResult> {
  if (!action) return CONFLICT_ACTION_ERROR;
  await action();
  return CONFLICT_ACTION_SUCCESS;
}

export function BlockUpdateConflictPanel({
  details,
  onCancel,
  onResolve,
  onAbandon,
  onRecreate,
  onDeleteExplicit,
  onAdoptCurrent,
  onRetryDraft,
  baselineBlocks,
}: BlockUpdateConflictPanelProps) {
  const t = useTranslations("studio.pageBlocksConflict");
  const tConflict = useTranslations("studio.conflictResolution");
  const scenario = selectBlockConflictPanelScenario(details);

  const apply = async (
    choices: ConflictResolutionChoices,
  ): Promise<ConflictActionExecutionResult> => {
    const indexedChoices = Object.fromEntries(
      details.conflicts.map((conflict, index) => [
        index,
        choices[getBlockConflictPresentationId(conflict.path)] === "server"
          ? "remote"
          : "local",
      ]),
    ) as Record<number, BlockConflictChoice>;
    const allServer = Object.values(choices).every((choice) => choice === "server");
    const deleted = details.conflicts.some((conflict) => conflict.kind === "blockDeleted");
    const deleteChanged = details.conflicts.some(
      (conflict) => conflict.kind === "blockChangedBeforeDelete",
    );

    if (deleted) {
      return allServer ? complete(onAbandon) : complete(onRecreate);
    }
    if (deleteChanged && !allServer && onDeleteExplicit) {
      return complete(onDeleteExplicit);
    }
    return executeBlockUpdateConflictChoice({
      scenarioKind: scenario.kind,
      allServer,
      indexedChoices,
      onAdoptCurrent,
      onRetryDraft,
      onResolve,
    });
  };
  const action: ConflictResolutionPanelAction = scenario.actionMode === "reload"
    ? {
        kind: "direct",
        label: t("choices.reloadSavedVersion"),
        onAction: () => complete(onAdoptCurrent),
      }
    : { kind: "choices", onApply: apply };

  return (
    <ConflictResolutionPanel
      action={action}
      conflictKey={`page-block-${details.currentBlocksRevision}-${details.operation}`}
      description={t(scenario.descriptionKey)}
      groups={toBlockConflictPresentation(details, t, {
        currentBlocks: details.current.blocks,
        baselineBlocks,
        localBlocks: details.candidateBlock ? [details.candidateBlock] : undefined,
        candidateBlock: details.candidateBlock,
      })}
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
      onCancel={() => {
        onCancel();
        return CONFLICT_ACTION_SUCCESS;
      }}
      title={t(scenario.titleKey)}
    />
  );
}

BlockUpdateConflictPanel.displayName = "BlockUpdateConflictPanel";
