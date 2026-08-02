"use client";

/**
 * @file apps/studio/src/features/pages/blocks/conflicts/BlockListConflictPanel.tsx
 * @layer studio/features/pages/blocks/conflicts
 * @description Block-list adapter for the shared OCC resolution panel.
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
import { toBlockConflictPresentation } from "@compoz/studio/features/pages/blocks/conflicts/block-conflict-presentation";

type BlockListConflictPanelProps = Readonly<{
  details: PageBlocksConflictDetails;
  isPending?: boolean;
  onCancel: () => void;
  onUseCurrent: () => void | Promise<void>;
  onKeepLocal?: () => void | Promise<void>;
  baselineBlocks?: readonly Block[];
  localBlocks?: readonly Block[];
}>;

async function complete(
  action: (() => void | Promise<void>) | undefined,
): Promise<ConflictActionExecutionResult> {
  if (!action) return CONFLICT_ACTION_ERROR;
  await action();
  return CONFLICT_ACTION_SUCCESS;
}

export function BlockListConflictPanel({
  details,
  isPending = false,
  onCancel,
  onUseCurrent,
  onKeepLocal,
  baselineBlocks,
  localBlocks,
}: BlockListConflictPanelProps) {
  const t = useTranslations("studio.pageBlocksConflict");
  const tConflict = useTranslations("studio.conflictResolution");
  const description = details.conflicts.some((conflict) => conflict.kind === "anchorMissing")
    ? t("anchorMissing")
    : details.conflicts.some((conflict) => conflict.kind === "blockChangedBeforeDelete")
      ? t("deleteChanged")
      : t("operation", { operation: details.operation });

  const apply = (choices: ConflictResolutionChoices) => {
    const keepLocal = Object.values(choices).some((choice) => choice === "local");
    return complete(keepLocal ? onKeepLocal : onUseCurrent);
  };

  return (
    <ConflictResolutionPanel
      conflictKey={`page-block-list-${details.currentBlocksRevision}-${details.operation}`}
      description={description}
      groups={toBlockConflictPresentation(details, t, {
        currentBlocks: details.current.blocks,
        baselineBlocks,
        localBlocks,
        candidateBlock: details.candidateBlock,
      })}
      isPending={isPending}
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
      title={t("title")}
    />
  );
}

BlockListConflictPanel.displayName = "BlockListConflictPanel";
