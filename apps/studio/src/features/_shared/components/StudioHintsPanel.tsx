"use client";

/**
 * @file apps/studio/src/features/_shared/components/StudioHintsPanel.tsx
 * @layer studio/features/_shared/components
 *
 * @description
 * Reusable expandable Studio panel for displaying prepared hint messages.
 *
 * @remarks
 * - Does not translate hint content; callers provide display-ready messages.
 * - Reuses shared warning panel labels from `studio.shared.warningsPanel.*`.
 * - Disables the panel when no hint is present.
 */

import { useTranslations } from "next-intl";

import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";

type StudioHintsPanelProps = Readonly<{
  id: string;
  hints: readonly string[];
  /** Visual variant used by the underlying hint list. */
  variant?: "warning" | "info";
  /** Optional list title; falls back to `studio.shared.warningsPanel.title`. */
  title?: string;
}>;

export function StudioHintsPanel({
  id,
  hints,
  variant = "warning",
  title,
}: StudioHintsPanelProps) {
  const t = useTranslations();

  const hasHints = hints.length > 0;

  return (
    <ExpandableLayout
      id={id}
      label={
        hasHints
          ? t("studio.shared.warningsPanel.labelWithCount", {
              count: hints.length,
            })
          : t("studio.shared.warningsPanel.label")
      }
      defaultOpen={false}
      disabled={!hasHints}
    >
      {hasHints ? (
        <HintList
          variant={variant}
          title={title ?? t("studio.shared.warningsPanel.title")}
          hints={hints}
        />
      ) : null}
    </ExpandableLayout>
  );
}

StudioHintsPanel.displayName = "StudioHintsPanel";
