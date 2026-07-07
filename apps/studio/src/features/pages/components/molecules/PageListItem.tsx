"use client";

/**
 * @file apps/studio/src/features/pages/components/molecules/PageListItem.tsx
 * @layer studio/features/pages/components/molecules
 *
 * @description
 * Compact page list row showing status, title, slug, and edit/delete actions.
 *
 * @remarks
 * - Parent components provide edit/delete callbacks and own confirmation or I/O orchestration.
 * - Keeps the deleting state reflected through ARIA attributes and disabled actions.
 * - Parent components own list semantics.
 */

import { FileText, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import type { PageSummaryDTO } from "@compoz/core/domain/pages/dto";
import type { SiteDiffKindDTO } from "@compoz/core/domain/site/dto";
import { DiffStatusBadge } from "@compoz/studio/components/atoms/badges/DiffStatusBadge";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { StudioButtonGroup } from "@compoz/studio/components/molecules/controls/StudioButtonGroup";
import { formatPagePath } from "@compoz/studio/lib/ui/pages";
import { cn } from "@compoz/ui/lib/utils";

type PageListItemProps = Readonly<{
  page: PageSummaryDTO;
  /** Status draft vs published (published / new / modified / deleted). */
  statusKind?: SiteDiffKindDTO;
  onEditMeta?: (pageId: string) => void;
  onEditContent?: (pageId: string) => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  disabled?: boolean;
}>;

/** Renders a page row; the parent owns list semantics. */
export function PageListItem({
  page,
  statusKind,
  onEditMeta,
  onEditContent,
  onDelete,
  isDeleting = false,
  disabled = false,
}: PageListItemProps) {
  const t = useTranslations();

  const isBusy = isDeleting;
  const baseDisabled = disabled || isBusy;

  const canEditMeta = Boolean(onEditMeta) && !baseDisabled;
  const canEditContent = Boolean(onEditContent) && !disabled;
  const canDelete = Boolean(onDelete) && !baseDisabled;

  const editMetaLabel = t("studio.pageListItem.editMeta");
  const editContentLabel = t("studio.pageListItem.editContent");
  const deletePageLabel = t("studio.pageListItem.deletePage");

  return (
    <div
      className={cn(
        "grid grid-cols-[max-content_minmax(0,1fr)_auto] items-center gap-3",
      )}
      aria-busy={isBusy || undefined}
      aria-disabled={baseDisabled || undefined}
    >
      <div className="flex min-w-[12ch] items-center justify-center">
        {statusKind ? (
          <DiffStatusBadge
            kind={statusKind}
            publishedLabel={t("common.published")}
          />
        ) : null}
      </div>

      <div>
        <Text as="p" truncate className="mb-0!">
          {page.name}
        </Text>

        <Text as="p" variant="meta" truncate>
          {formatPagePath(page.slug)}
        </Text>
      </div>

      <div className="shrink-0 justify-self-end">
        <StudioButtonGroup className="shrink-0">
          <TooltipButton
            type="button"
            variant="ghost"
            visualMode="studio"
            size="icon"
            onClick={() => onEditMeta?.(page.id)}
            disabled={!canEditMeta}
            aria-label={editMetaLabel}
            tooltip={
              !canEditMeta ? t("common.actionUnavailable") : editMetaLabel
            }
          >
            <StudioIcon icon={Settings} />
          </TooltipButton>

          <TooltipButton
            type="button"
            size="icon"
            variant="default"
            visualMode="studio"
            onClick={() => onEditContent?.(page.id)}
            disabled={!canEditContent}
            aria-label={editContentLabel}
            tooltip={
              !canEditContent ? t("common.actionUnavailable") : editContentLabel
            }
          >
            <StudioIcon icon={FileText} />
          </TooltipButton>

          <DeleteButton
            size="icon"
            disabled={!canDelete}
            isDeleting={isDeleting}
            onConfirmDelete={async () => onDelete?.()}
            ariaLabel={deletePageLabel}
            title={deletePageLabel}
          />
        </StudioButtonGroup>
      </div>
    </div>
  );
}

PageListItem.displayName = "PageListItem";
