"use client";

/**
 * @file apps/studio/src/features/pages/blocks/conflicts/BlockUpdateConflictPanel.tsx
 * @layer studio/features/pages/blocks/conflicts
 * @description Dedicated Page block update conflict chooser.
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import { ConflictResolutionPanel } from "@compoz/studio/features/conflicts/ConflictResolutionPanel";
import {
  CONFLICT_ACTION_ERROR,
  CONFLICT_ACTION_SUCCESS,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import { blockUpdateConflictPolicy } from "@compoz/studio/features/pages/blocks/conflicts/block-update-conflict-policy";
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
  onKeepCurrent?: () => void;
  onDeleteExplicit?: () => void | Promise<void>;
  onAdoptCurrent?: () => void;
  baselineBlocks?: readonly Block[];
}>;

export function BlockUpdateConflictPanel({
  details,
  onCancel,
  onResolve,
  onAbandon,
  onRecreate,
  onKeepCurrent,
  onDeleteExplicit,
  onAdoptCurrent,
  baselineBlocks,
}: BlockUpdateConflictPanelProps) {
  const [choices, setChoices] = useState<Record<string, BlockConflictChoice>>({});
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const t = useTranslations("studio.pageBlocksConflict");
  const tConflict = useTranslations("studio.conflictResolution");
  const conflictSignature = JSON.stringify(
    details.conflicts.map((conflict) => [conflict.kind, conflict.path]),
  );
  useEffect(() => {
    setChoices({});
    setIsResolving(false);
    setResolutionError(null);
  }, [conflictSignature, details.currentBlocksRevision]);

  const policy = useMemo(
    () => blockUpdateConflictPolicy({ details, choices: Object.fromEntries(details.conflicts.map((conflict, index) => [index, choices[getBlockConflictPresentationId(conflict.path)]])) }),
    [choices, details],
  );

  const resolveAsync = async (action: () => void | Promise<void>) => {
    if (isResolving) return CONFLICT_ACTION_ERROR;
    setResolutionError(null);
    setIsResolving(true);
    try {
      await action();
      return CONFLICT_ACTION_SUCCESS;
    } catch {
      setResolutionError(t("resolutionError"));
      return CONFLICT_ACTION_ERROR;
    } finally {
      setIsResolving(false);
    }
  };

  const indexedChoices = Object.fromEntries(details.conflicts.map((conflict, index) => [index, choices[getBlockConflictPresentationId(conflict.path)]])) as Record<number, BlockConflictChoice>;
  return <ConflictResolutionPanel
    actions={[
      { id: "cancel", label: policy.showKeepDraft ? t("keepDraft") : t("cancel"), variant: "outline", onClick: () => { onCancel(); return CONFLICT_ACTION_SUCCESS; }, focusAfterSuccess: "restore-trigger" as const },
      ...(policy.showApply ? [{ id: "apply", label: t("apply"), disabled: !policy.canApply, onClick: () => resolveAsync(() => onResolve(indexedChoices)), focusAfterSuccess: "restore-trigger" as const }] : []),
      ...(policy.showDeletedActions && onAbandon ? [{ id: "abandon", label: t("abandon"), variant: "outline" as const, onClick: () => { onAbandon(); return CONFLICT_ACTION_SUCCESS; } }] : []),
      ...(policy.showDeletedActions && onRecreate ? [{ id: "recreate", label: t("recreate"), onClick: () => resolveAsync(onRecreate), focusAfterSuccess: "none" as const }] : []),
      ...(policy.showDeleteChangedActions && onKeepCurrent ? [{ id: "current", label: t("useCurrent"), variant: "outline" as const, onClick: () => { onKeepCurrent(); return CONFLICT_ACTION_SUCCESS; }, focusAfterSuccess: "restore-trigger" as const }] : []),
      ...(policy.showDeleteChangedActions && onDeleteExplicit ? [{ id: "delete", label: t("forceDelete"), variant: "destructive" as const, onClick: () => resolveAsync(onDeleteExplicit) }] : []),
      ...(policy.showAdoptCurrent && onAdoptCurrent ? [{ id: "adopt", label: t("useCurrent"), onClick: () => { onAdoptCurrent(); return CONFLICT_ACTION_SUCCESS; }, focusAfterSuccess: "restore-trigger" as const }] : []),
    ]}
    conflictId={`page-block-${details.currentBlocksRevision}`}
    description={policy.showAdoptCurrent ? t("restartCurrent") : policy.requiresManualRebase ? t("manualRebase") : t("deletedOrChanged")}
    error={resolutionError ?? undefined}
    groups={toBlockConflictPresentation(details, choices, t, { currentBlocks: details.current.blocks, baselineBlocks, localBlocks: details.candidateBlock ? [details.candidateBlock] : undefined, candidateBlock: details.candidateBlock }, !policy.requiresManualRebase)}
    labels={{ baseline: t("baseline"), server: t("remote"), local: t("local"), useServer: t("useRemote"), keepLocal: t("keepLocal"), pending: tConflict("pending") }}
    onChoice={(id: string, choice: "server" | "local") => {
      setResolutionError(null);
      setChoices((current) => ({ ...current, [id]: choice === "server" ? "remote" : "local" }));
    }}
    pending={isResolving}
    title={t("updateTitle")}
  />;
}

BlockUpdateConflictPanel.displayName = "BlockUpdateConflictPanel";
