"use client";

/**
 * @file apps/studio/src/features/pages/blocks/conflicts/BlockListConflictPanel.tsx
 * @layer studio/features/pages/blocks/conflicts
 * @description Dedicated create/delete/reorder block conflict summary and explicit actions.
 */

import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import {
  areBlockListConflictActionsDisabled,
  createBlockListConflictActionLock,
} from "@compoz/studio/features/pages/blocks/conflicts/block-list-conflict-actions";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@compoz/ui/components/ui/card";

type BlockListConflictPanelProps = Readonly<{
  details: PageBlocksConflictDetails;
  isPending?: boolean;
  onUseCurrent: () => void | Promise<void>;
  onForceDelete?: () => void | Promise<void>;
  onRetryCreate?: () => void | Promise<void>;
}>;

export function BlockListConflictPanel({
  details,
  isPending = false,
  onUseCurrent,
  onForceDelete,
  onRetryCreate,
}: BlockListConflictPanelProps) {
  const t = useTranslations("studio.pageBlocksConflict");
  const actionLockRef = useRef(createBlockListConflictActionLock());
  const [isActionPending, setIsActionPending] = useState(false);
  const actionsDisabled = areBlockListConflictActionsDisabled({
    isPending,
    isActionPending,
  });
  const runAction = useCallback(
    async (action: () => void | Promise<void>) => {
      if (isPending) return;
      await actionLockRef.current.run(async () => {
        setIsActionPending(true);
        try {
          await action();
        } finally {
          setIsActionPending(false);
        }
      });
    },
    [isPending],
  );
  const orderConflict = details.conflicts.find(
    (conflict) => conflict.kind === "orderIncompatible",
  );
  const deleteConflict = details.conflicts.find(
    (conflict) => conflict.kind === "blockChangedBeforeDelete",
  );

  return (
    <Card role="alert">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>{t("operation", { operation: details.operation })}</p>
        {orderConflict?.kind === "orderIncompatible" ? (
          <div className="grid gap-2 md:grid-cols-2">
            <p>{t("currentOrder", { order: orderConflict.currentOrder.join(" → ") })}</p>
            <p>{t("localOrder", { order: orderConflict.localOrder.join(" → ") })}</p>
            <p>{t("added", { ids: orderConflict.addedBlockIds.join(", ") || t("none") })}</p>
            <p>{t("removed", { ids: orderConflict.removedBlockIds.join(", ") || t("none") })}</p>
          </div>
        ) : null}
        {details.conflicts.some((conflict) => conflict.kind === "anchorMissing") ? (
          <p>{t("anchorMissing")}</p>
        ) : null}
        {deleteConflict ? (
          <p>{t("deleteChanged")}</p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={actionsDisabled}
            onClick={() => void runAction(onUseCurrent)}
          >
            {t("useCurrent")}
          </Button>
          {deleteConflict && onForceDelete ? (
            <Button
              type="button"
              variant="destructive"
              disabled={actionsDisabled}
              onClick={() => void runAction(onForceDelete)}
            >
              {t("forceDelete")}
            </Button>
          ) : null}
          {details.operation === "create" && onRetryCreate ? (
            <Button
              type="button"
              disabled={actionsDisabled}
              onClick={() => void runAction(onRetryCreate)}
            >
              {t("addAtEnd")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

BlockListConflictPanel.displayName = "BlockListConflictPanel";
