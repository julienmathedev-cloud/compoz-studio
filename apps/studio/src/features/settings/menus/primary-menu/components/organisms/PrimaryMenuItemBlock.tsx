"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/components/organisms/PrimaryMenuItemBlock.tsx
 * @layer ui/studio/organisms
 *
 * @description
 * Bloc d’édition d’un item du menu principal :
 * - ligne parent
 * - liste des sous-liens
 * - actions locales sur les enfants
 *
 * @remarks
 * - Strictement UI-only : aucune logique métier.
 * - Ce composant factorise uniquement le rendu et les callbacks locaux d’un item parent.
 * - Le formulaire parent reste l’orchestrateur RHF global (`useForm`, `useFieldArray`, warnings, submit, reset, etc.).
 * - Les rows spécialisées (`PrimaryMenuParentRow`, `PrimaryMenuChildRow`) restent séparées.
 * - Les enfants utilisent désormais `id` comme identifiant métier stable :
 *   - clés React
 *   - drag and drop
 *   - stabilité du reorder sans dépendre de l’index
 */

import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Fragment, useCallback, useMemo } from "react";
import type { Control, UseFormSetFocus, UseFormTrigger } from "react-hook-form";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { PrimaryMenuChildRow } from "@compoz/studio/features/settings/menus/primary-menu/components/molecules/PrimaryMenuChildRow";
import { PrimaryMenuParentRow } from "@compoz/studio/features/settings/menus/primary-menu/components/molecules/PrimaryMenuParentRow";
import { Separator } from "@compoz/ui/components/ui/separator";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type {
  PrimaryMenuChildFormValues,
  PrimaryMenuFormValues,
  PrimaryMenuItemFormValues,
} from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";

type PrimaryMenuItemBlockProps = Readonly<{
  sortableId: string;
  pIdx: number;
  totalParents: number;
  control: Control<PrimaryMenuFormValues>;
  trigger: UseFormTrigger<PrimaryMenuFormValues>;
  setFocus: UseFormSetFocus<PrimaryMenuFormValues>;
  disabled: boolean;
  showError: boolean;
  formIdPrefix: string;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  parent: PrimaryMenuItemFormValues;
  onRemoveParent: () => void;
  setChildren: (
    pIdx: number,
    nextChildren: PrimaryMenuChildFormValues[],
  ) => void;
  createEmptyChild: () => PrimaryMenuChildFormValues;
  enforceParentRulesIfHasChildren: (pIdx: number) => void;

  /**
   * Vrai pendant un drag de niveau parent.
   *
   * @remarks
   * - Replie temporairement les children.
   * - Désactive / démonte le DnD enfant pour éviter les collisions visuelles
   *   entre contextes parent et enfant.
   */
  isSortingParents: boolean;
}>;

/**
 * Bloc UI d’un item parent du menu principal.
 */
export function PrimaryMenuItemBlock({
  sortableId,
  pIdx,
  totalParents,
  control,
  trigger,
  setFocus,
  disabled,
  showError,
  formIdPrefix,
  internalPageOptions,
  parent,
  onRemoveParent,
  setChildren,
  createEmptyChild,
  enforceParentRulesIfHasChildren,
  isSortingParents,
}: PrimaryMenuItemBlockProps) {
  const parentIdPrefix = `${formIdPrefix}-parent-${pIdx}`;
  const children = useMemo(() => parent.children ?? [], [parent.children]);

  const handleChildDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;
      if (disabled || isSortingParents) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const oldIndex = children.findIndex((child) => child.id === activeId);
      const newIndex = children.findIndex((child) => child.id === overId);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

      const next = [...children];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);

      setChildren(pIdx, next);

      // ✅ Recalage des erreurs RHF sur les enfants
      await trigger(`items.${pIdx}.children` as const);
    },
    [children, disabled, isSortingParents, pIdx, setChildren, trigger],
  );

  /**
   * Pendant un drag parent :
   * - on démonte totalement le DnD enfant
   * - on évite ainsi qu’un contexte voisin reste actif visuellement
   */
  const renderChildren = !isSortingParents ? (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleChildDragEnd}
    >
      <SortableContext
        items={children.map((child) => child.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className={cn(STACK_MD)}>
          {children.map((child, cIdx) => {
            const childIdPrefix = `${formIdPrefix}-child-${pIdx}-${cIdx}`;

            return (
              <PrimaryMenuChildRow
                key={child.id}
                sortableId={child.id}
                pIdx={pIdx}
                cIdx={cIdx}
                control={control}
                trigger={trigger}
                disabled={disabled || isSortingParents}
                showError={showError}
                childIdPrefix={childIdPrefix}
                internalPageOptions={internalPageOptions}
                onRemove={() => {
                  const next = [...children];
                  next.splice(cIdx, 1);
                  setChildren(pIdx, next);
                  void trigger(`items.${pIdx}.children` as const);
                }}
              />
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  ) : null;

  return (
    <Fragment>
      <div>
        <PrimaryMenuParentRow
          sortableId={sortableId}
          pIdx={pIdx}
          control={control}
          trigger={trigger}
          disabled={disabled}
          showError={showError}
          parentIdPrefix={parentIdPrefix}
          internalPageOptions={internalPageOptions}
          onRemove={onRemoveParent}
          onAddChild={() => {
            const nextChildIndex = children.length;

            const nextChild = createEmptyChild();
            const nextChildren = [...children, nextChild];
            setChildren(pIdx, nextChildren);

            // Force `newTab=false` sur le parent dès qu’il a des enfants.
            enforceParentRulesIfHasChildren(pIdx);

            // Conserve le comportement actuel : validation du href parent.
            void trigger(`items.${pIdx}.href` as const);

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setFocus(
                  `items.${pIdx}.children.${nextChildIndex}.label` as const,
                );
              });
            });
          }}
          renderChildren={renderChildren}
          childrenCount={children.length}
          isSortingParents={isSortingParents}
        />
      </div>

      {pIdx < totalParents - 1 ? <Separator /> : null}
    </Fragment>
  );
}

PrimaryMenuItemBlock.displayName = "PrimaryMenuItemBlock";
