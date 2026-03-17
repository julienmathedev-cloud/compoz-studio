"use client";

/**
 * @file apps/studio/src/features/pages/components/molecules/ChildPageListItem.tsx
 * @layer ui/studio/pages/molecules
 *
 * @description
 * Ligne compacte pour afficher une page enfant (titre + slug) avec poignée
 * de drag & drop.
 *
 * @remarks
 * - Molecule UI : calquée sur `PageListItem` pour conserver le même rythme visuel
 *   (grid / colonnes / espacements).
 * - Le réordonnancement est piloté par `dnd-kit` via `useSortable`.
 * - Supporte un état occupé local (`isReordering`) : ARIA + désactivation cohérente.
 * - Strictement UI-only : aucune logique métier.
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

/**
 * Props du composant `ChildPageListItem`.
 */
type ChildPageListItemProps = Readonly<{
  /** Référence minimaliste de la page enfant (titre + slug). */
  page: PageSummaryDTO;

  /** Statut draft vs published (optionnel). */
  statusKind?: SiteDiffKindDTO;

  /** Index courant de l’item dans la liste. */
  index: number;

  /** Taille totale de la liste. */
  total: number;

  /** Indique un réordonnancement en cours (désactive le drag). */
  isReordering?: boolean;

  /** Désactive toute la ligne (verrouillage global optionnel). */
  disabled?: boolean;
}>;

/**
 * Ligne UI d’une page enfant dans la liste (studio).
 *
 * @remarks
 * Ne rend pas de `<li>` : le conteneur parent gère la sémantique de liste.
 */
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
