"use client";

/**
 * @file apps/studio/src/features/confirm/ConfirmationDialogDescription.tsx
 * @layer studio/features/confirm
 *
 * @description
 * Presentational confirmation dialog body with optional intro text and hint list content.
 *
 * @remarks
 * - Delegates visual tone to `HintList` through `variant`.
 * - Accepts authored React content for both intro and hints so callers can include links or formatted text.
 */

import type { ReactNode } from "react";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";

type Variant = "info" | "warning" | "success" | "error";

export type ConfirmationDialogProps = Readonly<{
  intro?: ReactNode;
  hints: ReadonlyArray<ReactNode>;
  variant?: Variant;
}>;

export function ConfirmationDialogDescription({
  intro,
  hints,
  variant = "info",
}: ConfirmationDialogProps) {
  return (
    <div className="flex flex-col gap-2">
      {intro ? (
        <Text as="p" className="text-sm">
          {intro}
        </Text>
      ) : null}

      <HintList hints={hints} variant={variant} className="mt-2" />
    </div>
  );
}

ConfirmationDialogDescription.displayName = "ConfirmationDialogDescription";
