"use client";

/**
 * @file apps/studio/src/components/layouts/ExpandableLayout.tsx
 * @layer studio/layouts
 *
 * @description
 * Collapsible summary/details layout built on the ShadCN Accordion.
 *
 * @remarks
 * - Reduces visual load by grouping advanced options.
 * - Supports uncontrolled and controlled open state.
 * - `forceClosed` temporarily enforces a one-way closed state, for example during a parent drag.
 */

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@compoz/ui/components/ui/accordion";
import { useIdPrefix } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";

export type ExpandableLayoutProps = Readonly<{
  summary?: ReactNode;

  children: ReactNode;

  label?: string;

  defaultOpen?: boolean;

  disabled?: boolean;

  open?: boolean;

  /** Temporarily forces the layout closed without losing local state. */
  forceClosed?: boolean;

  onOpenChange?: (open: boolean) => void;

  id?: string;

  className?: string;
  triggerClassName?: string;
}>;

export function ExpandableLayout({
  summary,
  children,
  label,
  defaultOpen = false,
  disabled = false,
  open,
  forceClosed = false,
  onOpenChange,
  id,
  className,
  triggerClassName,
}: ExpandableLayoutProps) {
  const fallbackId = useIdPrefix("expandable");
  const itemValue = useMemo(() => id ?? fallbackId, [id, fallbackId]);

  // Uncontrolled state is preserved while `forceClosed` temporarily hides the content.
  const [openState, setOpenState] = useState(Boolean(defaultOpen));

  const isControlled = typeof open === "boolean";

  /**
   * Opening priority:
   * 1. `forceClosed` always closes the layout.
   * 2. Controlled mode uses `open`.
   * 3. Uncontrolled mode uses local state.
   */
  const effectiveOpen = forceClosed
    ? false
    : isControlled
      ? Boolean(open)
      : openState;

  const t = useTranslations();
  const resolvedLabel = label ?? t("studio.expandable.advancedOptions");

  return (
    <div className={cn(className, "flex flex-col")}>
      {summary ? <div>{summary}</div> : null}

      <Accordion
        type="single"
        collapsible
        value={effectiveOpen ? itemValue : ""}
        onValueChange={(v) => {
          const nextOpen = v === itemValue;

          // Ignore user interactions while forced closed.
          if (forceClosed) {
            onOpenChange?.(false);
            return;
          }

          if (isControlled) {
            onOpenChange?.(nextOpen);
            return;
          }

          setOpenState(nextOpen);
          onOpenChange?.(nextOpen);
        }}
      >
        <AccordionItem value={itemValue}>
          <AccordionTrigger
            disabled={disabled || forceClosed}
            className={cn(triggerClassName, "leading-none")}
          >
            {resolvedLabel}
          </AccordionTrigger>

          <AccordionContent>{children}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

ExpandableLayout.displayName = "ExpandableLayout";
