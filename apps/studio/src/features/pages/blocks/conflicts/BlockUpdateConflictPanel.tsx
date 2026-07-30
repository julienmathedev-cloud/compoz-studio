"use client";

/**
 * @file apps/studio/src/features/pages/blocks/conflicts/BlockUpdateConflictPanel.tsx
 * @layer studio/features/pages/blocks/conflicts
 * @description Dedicated Page block update conflict chooser.
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { blockUpdateConflictPolicy } from "@compoz/studio/features/pages/blocks/conflicts/block-update-conflict-policy";
import type { BlockConflictChoice } from "@compoz/studio/features/pages/blocks/conflicts/resolve-block-conflict";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@compoz/ui/components/ui/card";

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
}>;

function readable(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function BlockUpdateConflictPanel({
  details,
  onCancel,
  onResolve,
  onAbandon,
  onRecreate,
  onKeepCurrent,
  onDeleteExplicit,
  onAdoptCurrent,
}: BlockUpdateConflictPanelProps) {
  const [choices, setChoices] = useState<Record<number, BlockConflictChoice>>({});
  const [isResolving, setIsResolving] = useState(false);
  const t = useTranslations("studio.pageBlocksConflict");
  const resolvable = details.conflicts.filter(
    (conflict) => conflict.kind === "fieldConflict",
  );
  const conflictSignature = JSON.stringify(
    details.conflicts.map((conflict) => [conflict.kind, conflict.path]),
  );
  useEffect(() => {
    setChoices({});
    setIsResolving(false);
  }, [conflictSignature, details.currentBlocksRevision]);

  const policy = useMemo(
    () => blockUpdateConflictPolicy({ details, choices }),
    [choices, details],
  );

  const resolveAsync = async (action: () => void | Promise<void>) => {
    if (isResolving) return;
    setIsResolving(true);
    try {
      await action();
    } catch {
      // Mutation hooks already expose either the next conflict or a save error.
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Card role="alert">
      <CardHeader>
        <CardTitle>{t("updateTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {resolvable.length === 0 ? (
          <p>
            {policy.showAdoptCurrent
              ? t("restartCurrent")
              : policy.requiresManualRebase
                ? t("manualRebase")
                : t("deletedOrChanged")}
          </p>
        ) : null}
        {details.conflicts.map((conflict, index) => (
          <div className="space-y-2 rounded border p-3" key={`${conflict.path}-${index}`}>
            <p className="font-medium">{conflict.path}</p>
            {conflict.kind === "fieldConflict" ? (
              <>
                <div className="grid gap-2 md:grid-cols-3">
                  <pre className="whitespace-pre-wrap text-xs">{t("baseline")} : {readable(conflict.baseline)}</pre>
                  <pre className="whitespace-pre-wrap text-xs">{t("remote")} : {readable(conflict.current)}</pre>
                  <pre className="whitespace-pre-wrap text-xs">{t("local")} : {readable(conflict.local)}</pre>
                </div>
                {!policy.requiresManualRebase ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      disabled={isResolving}
                      variant={choices[index] === "remote" ? "default" : "outline"}
                      onClick={() => setChoices((current) => ({ ...current, [index]: "remote" }))}
                    >
                      {t("useRemote")}
                    </Button>
                    <Button
                      type="button"
                      disabled={isResolving}
                      variant={choices[index] === "local" ? "default" : "outline"}
                      onClick={() => setChoices((current) => ({ ...current, [index]: "local" }))}
                    >
                      {t("keepLocal")}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <p>
                {conflict.kind === "blockDeleted"
                  ? t("deletedOrChanged")
                  : conflict.kind === "blockChangedBeforeDelete"
                    ? t("deleteChanged")
                    : conflict.kind === "revisionAhead" ||
                        details.conflictKind === "contention"
                      ? t("restartCurrent")
                      : t("manualRebase")}
              </p>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isResolving}
            onClick={onCancel}
          >
            {policy.showKeepDraft ? t("keepDraft") : t("cancel")}
          </Button>
          {policy.showApply ? (
            <Button
              type="button"
              disabled={!policy.canApply || isResolving}
              onClick={() => void resolveAsync(() => onResolve(choices))}
            >
              {t("apply")}
            </Button>
          ) : null}
          {policy.showDeletedActions && onAbandon ? (
            <Button
              type="button"
              variant="outline"
              disabled={isResolving}
              onClick={onAbandon}
            >
              {t("abandon")}
            </Button>
          ) : null}
          {policy.showDeletedActions && onRecreate ? (
            <Button
              type="button"
              disabled={isResolving}
              onClick={() => void resolveAsync(onRecreate)}
            >
              {t("recreate")}
            </Button>
          ) : null}
          {policy.showDeleteChangedActions && onKeepCurrent ? (
            <Button
              type="button"
              variant="outline"
              disabled={isResolving}
              onClick={onKeepCurrent}
            >
              {t("useCurrent")}
            </Button>
          ) : null}
          {policy.showDeleteChangedActions && onDeleteExplicit ? (
            <Button
              type="button"
              disabled={isResolving}
              onClick={() => void resolveAsync(onDeleteExplicit)}
            >
              {t("forceDelete")}
            </Button>
          ) : null}
          {policy.showAdoptCurrent && onAdoptCurrent ? (
            <Button
              type="button"
              disabled={isResolving}
              onClick={onAdoptCurrent}
            >
              {t("useCurrent")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

BlockUpdateConflictPanel.displayName = "BlockUpdateConflictPanel";
