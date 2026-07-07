"use client";

/**
 * @file apps/studio/src/features/confirm/useConfirmList.tsx
 * @layer studio/features/confirm
 *
 * @description
 * Hook exposing a confirmation variant with intro text and explanatory list items.
 *
 * @remarks
 * - Assumes `title`, `intro`, and `items` are already translated by the caller.
 * - Builds on `useConfirm()` and `ConfirmationDialogDescription` to keep list rendering consistent.
 */

import type { ReactNode } from "react";
import { useCallback } from "react";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { ConfirmationDialogDescription } from "@compoz/studio/features/confirm/ConfirmationDialogDescription";
import { useConfirm } from "@compoz/studio/features/confirm/useConfirm";
import { cn } from "@compoz/ui/lib/utils";
import { TITLE_H3 } from "@compoz/ui/styles/studio/typography";

type ConfirmTone = "default" | "danger";

export type ConfirmListParams = Readonly<{
  title: ReactNode;
  intro?: ReactNode;
  items: ReadonlyArray<ReactNode>;
  confirmLabel: string;
  cancelLabel: string;
  /** Requires an acknowledge checkbox when provided. */
  requireAckLabel?: string;
  tone?: ConfirmTone;
}>;

export type UseConfirmList = (params: ConfirmListParams) => Promise<boolean>;

/** Returns a `confirmList(params)` helper backed by the global confirmation provider. */
export function useConfirmList(): UseConfirmList {
  const confirm = useConfirm();

  return useCallback(
    async ({
      title,
      intro,
      items,
      confirmLabel,
      cancelLabel,
      requireAckLabel,
      tone = "default",
    }: ConfirmListParams) => {
      return confirm({
        title: (
          <Text as="p" className={cn(TITLE_H3)}>
            {title}
          </Text>
        ),
        description: (
          <ConfirmationDialogDescription
            intro={intro}
            hints={items}
            variant="info"
          />
        ),
        confirmLabel,
        cancelLabel,
        tone,
        requireAcknowledge: requireAckLabel
          ? { label: requireAckLabel }
          : undefined,
      });
    },
    [confirm],
  );
}

useConfirmList.displayName = "useConfirmList";
