"use client";

/**
 * @file apps/studio/src/components/layouts/SettingsSection.tsx
 * @layer studio/layouts
 *
 * @description
 * Standard wrapper for Studio settings sections.
 *
 * @remarks
 * - Encapsulates the accessible `<section>` structure with label, description, and busy state.
 * - Supports visible or screen-reader-only headings, optional descriptions, and form status badges.
 * - `isLoading` replaces only the `children` area with a section loader.
 */

import type { ReactNode } from "react";
import { useMemo } from "react";

import {
  SectionFormStatusBadge,
  type SectionFormStatusKind,
} from "@compoz/studio/components/atoms/badges/SectionFormStatusBadge";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { SectionLoader } from "@compoz/studio/components/loading/SectionLoader";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import { useTranslations } from "next-intl";

type SettingsSectionProps = Readonly<{
  id: string;

  title: string;

  description?: string;

  isLoading?: boolean;

  loadingLabel?: string;

  isBusy?: boolean;

  isDirty?: boolean;

  blockingErrorsCount?: number;

  headingLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  visuallyHiddenTitle?: boolean;

  showStatusBadge?: boolean;

  children: ReactNode;

  className?: string;
}>;

export function SettingsSection({
  id,
  title,
  description,
  isLoading,
  loadingLabel,
  isBusy,
  isDirty,
  blockingErrorsCount = 0,
  headingLevel = "h2",
  visuallyHiddenTitle = false,
  showStatusBadge = true,
  children,
  className,
}: SettingsSectionProps) {
  const t = useTranslations();

  const titleId = `${id}-title`;
  const descId = description ? `${id}-desc` : undefined;

  const loaderLabel =
    loadingLabel ??
    t("studio.shared.loading.section", { title: title.toLowerCase() });

  const statusKind: SectionFormStatusKind =
    useMemo((): SectionFormStatusKind => {
      if (
        id === "overview" ||
        id === "pages-list" ||
        id === "blocks" ||
        id === "page-blocks"
      )
        return "none";
      if (isBusy) return "saving";
      if (blockingErrorsCount > 0) return "error";
      if (isDirty) return "modified";
      return "saved";
    }, [isBusy, isDirty, id, blockingErrorsCount]);

  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-busy={isBusy || isLoading || undefined}
      className={cn(STACK_MD, className)}
    >
      {/* Section header: title and optional status badge. */}
      <div className="flex items-center gap-6">
        <Heading
          id={titleId}
          as={headingLevel}
          visuallyHidden={visuallyHiddenTitle}
        >
          {title}
        </Heading>

        {showStatusBadge && !visuallyHiddenTitle ? (
          <div className="shrink-0">
            <SectionFormStatusBadge
              kind={statusKind}
              count={statusKind === "error" ? blockingErrorsCount : 0}
            />
          </div>
        ) : null}
      </div>

      {description && (
        <Text id={descId} as="p">
          {description}
        </Text>
      )}

      {isLoading ? (
        <SectionLoader label={loaderLabel} />
      ) : (
        <div className={cn(STACK_MD)}>{children}</div>
      )}
    </section>
  );
}

SettingsSection.displayName = "SettingsSection";
