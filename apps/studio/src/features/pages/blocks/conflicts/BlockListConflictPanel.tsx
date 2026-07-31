"use client";

/**
 * @file apps/studio/src/features/pages/blocks/conflicts/BlockListConflictPanel.tsx
 * @layer studio/features/pages/blocks/conflicts
 * @description Dedicated create/delete/reorder block conflict summary and explicit actions.
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import {
  areBlockListConflictActionsDisabled,
  createBlockListConflictActionLock,
} from "@compoz/studio/features/pages/blocks/conflicts/block-list-conflict-actions";
import { ConflictResolutionPanel } from "@compoz/studio/features/conflicts/ConflictResolutionPanel";
import {
  CONFLICT_ACTION_ERROR,
  CONFLICT_ACTION_SUCCESS,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import { toBlockConflictPresentation } from "@compoz/studio/features/pages/blocks/conflicts/block-conflict-presentation";

type BlockListConflictPanelProps = Readonly<{
  details: PageBlocksConflictDetails;
  isPending?: boolean;
  onUseCurrent: () => void | Promise<void>;
  onForceDelete?: () => void | Promise<void>;
  onRetryCreate?: () => void | Promise<void>;
  useCurrentFocusAfterSuccess: "restore-trigger" | "panel" | "none";
  baselineBlocks?: readonly Block[];
  localBlocks?: readonly Block[];
}>;

export function BlockListConflictPanel({
  details,
  isPending = false,
  onUseCurrent,
  onForceDelete,
  onRetryCreate,
  useCurrentFocusAfterSuccess,
  baselineBlocks,
  localBlocks,
}: BlockListConflictPanelProps) {
  const t = useTranslations("studio.pageBlocksConflict");
  const tConflict = useTranslations("studio.conflictResolution");
  const actionLockRef = useRef(createBlockListConflictActionLock());
  const [isActionPending, setIsActionPending] = useState(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const actionsDisabled = areBlockListConflictActionsDisabled({
    isPending,
    isActionPending,
  });
  const runAction = useCallback(
    async (action: () => void | Promise<void>) => {
      if (isPending) return CONFLICT_ACTION_ERROR;
      setResolutionError(null);
      let result = CONFLICT_ACTION_ERROR;
      await actionLockRef.current.run(async () => {
        setIsActionPending(true);
        try {
          await action();
          result = CONFLICT_ACTION_SUCCESS;
        } catch {
          setResolutionError(t("resolutionError"));
        } finally {
          setIsActionPending(false);
        }
      });
      return result;
    },
    [isPending, t],
  );
  const deleteConflict = details.conflicts.find(
    (conflict) => conflict.kind === "blockChangedBeforeDelete",
  );

  return <ConflictResolutionPanel
    actions={[
      { id: "current", label: t("useCurrent"), variant: "outline" as const, onClick: () => runAction(onUseCurrent), focusAfterSuccess: useCurrentFocusAfterSuccess },
      ...(deleteConflict && onForceDelete ? [{ id: "delete", label: t("forceDelete"), variant: "destructive" as const, onClick: () => runAction(onForceDelete) }] : []),
      ...(details.operation === "create" && onRetryCreate ? [{ id: "retry", label: t("addAtEnd"), onClick: () => runAction(onRetryCreate), focusAfterSuccess: "none" as const }] : []),
    ]}
    conflictId={`page-block-list-${details.currentBlocksRevision}-${details.operation}`}
    description={details.conflicts.some((conflict) => conflict.kind === "anchorMissing") ? t("anchorMissing") : deleteConflict ? t("deleteChanged") : t("operation", { operation: details.operation })}
    error={resolutionError ?? undefined}
    groups={toBlockConflictPresentation(details, {}, t, { currentBlocks: details.current.blocks, baselineBlocks, localBlocks, candidateBlock: details.candidateBlock }, false)}
    labels={{ baseline: t("baseline"), server: t("remote"), local: t("local"), useServer: t("useRemote"), keepLocal: t("keepLocal"), pending: tConflict("pending") }}
    pending={actionsDisabled}
    title={t("title")}
  />;
}

BlockListConflictPanel.displayName = "BlockListConflictPanel";
