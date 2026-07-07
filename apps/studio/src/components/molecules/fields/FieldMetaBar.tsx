"use client";

/**
 * @file apps/studio/src/components/molecules/fields/FieldMetaBar.tsx
 * @layer studio/molecules/fields
 *
 * @description
 * Field metadata bar for non-blocking helper text and optional character counts.
 *
 * @remarks
 * - Composes `HelpText` for contextual, non-blocking field information.
 * - Keeps the counter purely informational through `aria-hidden`.
 * - Renders `null` when no text or counter is provided.
 */

import type { ReactNode } from "react";

import { HelpText } from "@compoz/studio/components/atoms/typography/HelpText";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_BETWEEN } from "@compoz/ui/styles/studio/layout";

export type FieldMetaBarProps = Readonly<{
  text?: string | ReactNode;
  textId?: string;
  count?: number;
  max?: number;
}>;

export function FieldMetaBar({ text, textId, count, max }: FieldMetaBarProps) {
  const hasCounter = typeof count === "number";
  const counterText =
    hasCounter && typeof max === "number"
      ? `${count}/${max}`
      : hasCounter
        ? `${count}`
        : null;

  if (!text && !counterText) return null;

  return (
    <span className={cn(ROW_BETWEEN)}>
      {text ? (
        <HelpText as="span" id={textId}>
          {text}
        </HelpText>
      ) : (
        <span />
      )}

      {counterText && (
        <HelpText as="span" aria-hidden className="tabular-nums">
          {counterText}
        </HelpText>
      )}
    </span>
  );
}

FieldMetaBar.displayName = "FieldMetaBar";
