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
} from "@compoz/studio/features/conflicts/ConflictResolutionPanel";
import {
  CONFLICT_ACTION_ERROR,
  CONFLICT_ACTION_SUCCESS,
  type ConflictActionExecutionResult,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  getBlockConflictPresentationId,
  toBlockConflictPresentation,
} from "@compoz/studio/features/pages/blocks/conflicts/block-conflict-presentation";
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
  baselineBlocks?: readonly Block[];
}>;

async function complete(
  action: (() => void | Promise<void>) | undefined,
): Promise<ConflictActionExecutionResult> {
  if (!action) return CONFLICT_ACTION_ERROR;
  await action();
  return CONFLICT_ACTION_SUCCESS;
}

function conflictDescriptionKey(details: PageBlocksConflictDetails): string {
  if (details.conflicts.every((conflict) => conflict.kind === "fieldConflict")) {
    return "fieldConflictDescription";
  }
  if (details.conflicts.some((conflict) => conflict.kind === "blockDeleted")) {
    return "blockDeletedDescription";
  }
  if (details.conflicts.some((conflict) => conflict.kind === "orderIncompatible")) {
    return "orderConflictDescription";
  }
  return "structuralConflictDescription";
}

export function BlockUpdateConflictPanel({
  details,
  onCancel,
  onResolve,
  onAbandon,
  onRecreate,
  onDeleteExplicit,
  onAdoptCurrent,
  baselineBlocks,
}: BlockUpdateConflictPanelProps) {
  const t = useTranslations("studio.pageBlocksConflict");
  const tConflict = useTranslations("studio.conflictResolution");

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
    if (allServer && onAdoptCurrent) return complete(onAdoptCurrent);
    return complete(() => onResolve(indexedChoices));
  };

  return (
    <ConflictResolutionPanel
      conflictKey={`page-block-${details.currentBlocksRevision}-${details.operation}`}
      description={t(conflictDescriptionKey(details))}
      groups={toBlockConflictPresentation(details, t, {
        currentBlocks: details.current.blocks,
        baselineBlocks,
        localBlocks: details.candidateBlock ? [details.candidateBlock] : undefined,
        candidateBlock: details.candidateBlock,
      })}
      labels={{
        baseline: t("baseline"),
        server: t("remote"),
        local: t("local"),
        useServer: tConflict("actions.useServer"),
        keepLocal: tConflict("actions.keepLocal"),
        pending: tConflict("pending"),
        cancel: tConflict("actions.cancel"),
        apply: tConflict("actions.apply"),
      }}
      onApply={apply}
      onCancel={() => {
        onCancel();
        return CONFLICT_ACTION_SUCCESS;
      }}
      title={t("updateTitle")}
    />
  );
}

BlockUpdateConflictPanel.displayName = "BlockUpdateConflictPanel";
