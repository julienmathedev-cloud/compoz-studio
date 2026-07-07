"use client";

/**
 * @file apps/studio/src/features/pages/components/molecules/ChildPageListItem.tsx
 * @layer studio/features/pages/components/molecules
 *
 * @description
 * Compact sortable child page row showing status, title, slug, and list position.
 *
 * @remarks
 * - Mirrors `PageListItem` spacing and grid rhythm for consistent nested page lists.
 * - Uses dnd-kit `useSortable` directly while `DragHandle` owns the listeners.
 * - Keeps the reordering state reflected through ARIA attributes and disabled drag controls.
 * - Parent components own list semantics.
 */

import { useSortable } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";

import type { PageSummaryDTO } from "@compoz/core/domain/pages/dto";
import type { SiteDiffKindDTO } from "@compoz/core/domain/site/dto";
import { DiffStatusBadge } from "@compoz/studio/components/atoms/badges/DiffStatusBadge";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { formatPagePath } from "@compoz/studio/lib/ui/pages";
import { cn } from "@compoz/ui/lib/utils";

type ChildPageListItemProps = Readonly<{
  page: PageSummaryDTO;
  statusKind?: SiteDiffKindDTO;
  index: number;
  total: number;
  isReordering?: boolean;
  disabled?: boolean;
}>;

/** Renders a sortable child page row; the parent owns list semantics. */
export function ChildPageListItem({
  page,
  statusKind,
  index,
  total,
  isReordering = false,
  disabled = false,
}: ChildPageListItemProps) {
  const t = useTranslations();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    disabled: disabled || isReordering,
  });

  const isBusy = isReordering;
  const baseDisabled = disabled || isBusy;

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid grid-cols-[auto_max-content_1fr_auto] items-center gap-3",
        isDragging && "opacity-60",
      )}
      aria-busy={isBusy || undefined}
      aria-disabled={baseDisabled || undefined}
    >
      <div className="flex items-center justify-center">
        <DragHandle
          className={cn(baseDisabled && "pointer-events-none opacity-50")}
          {...attributes}
          {...listeners}
        />
      </div>

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

      <div className="justify-self-end">
        <Text as="p" variant="meta">
          {t("studio.pageForm.childrens.position", {
            current: index + 1,
            total,
          })}
        </Text>
      </div>
    </div>
  );
}

ChildPageListItem.displayName = "ChildPageListItem";
