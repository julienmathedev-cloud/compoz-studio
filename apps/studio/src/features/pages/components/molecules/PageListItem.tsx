"use client";

/**
 * @file apps/studio/src/features/pages/components/molecules/PageListItem.tsx
 * @layer ui/studio/pages/molecules
 *
 * @description
 * Ligne compacte pour afficher une page (titre + slug) avec des actions rapides.
 *
 * @remarks
 * - Molecule UI : compose `Text`, `TooltipButton`, `DeleteButton`, `StudioButtonGroup`.
 * - Les callbacks sont fournis par le parent (orchestration via hooks / sections).
 * - Supporte un état occupé local (`isDeleting`) : ARIA + désactivation cohérente.
 * - Strictement UI-only : aucune logique métier.
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

/**
 * Props du composant `PageListItem`.
 */
type PageListItemProps = Readonly<{
  /** Référence minimaliste de la page (titre + slug). */
  page: PageSummaryDTO;

  /** Statut draft vs published (clean / new / dirty / deleted). */
  statusKind?: SiteDiffKindDTO;

  /** Action : éditer les métadonnées (id). */
  onEditMeta?: (pageId: string) => void;

  /** Action : éditer le contenu (id). */
  onEditContent?: (pageId: string) => void;

  /** Action : suppression (confirmation + I/O gérées par le parent). */
  onDelete?: () => void;

  /** Indique une suppression en cours (désactive les actions concernées). */
  isDeleting?: boolean;

  /** Désactive toute la ligne (verrouillage global optionnel). */
  disabled?: boolean;
}>;

/**
 * Ligne UI d’une page dans la liste (studio).
 *
 * @remarks
 * Ne rend pas de `<li>` : le conteneur parent gère la sémantique de liste.
 */
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
