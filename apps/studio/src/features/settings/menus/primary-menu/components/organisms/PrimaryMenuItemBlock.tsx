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
 */

import { Fragment } from "react";
import type { Control, UseFormSetFocus, UseFormTrigger } from "react-hook-form";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { PrimaryMenuChildRow } from "@compoz/studio/features/settings/menus/primary-menu/components/molecules/PrimaryMenuChildRow";
import { PrimaryMenuParentRow } from "@compoz/studio/features/settings/menus/primary-menu/components/molecules/PrimaryMenuParentRow";
import { Separator } from "@compoz/ui/components/ui/separator";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type {
  PrimaryMenuChildFormValues,
  PrimaryMenuFormValues,
  PrimaryMenuItemFormValues,
} from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";

type PrimaryMenuItemBlockProps = Readonly<{
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
  onMoveParentUp: () => void;
  onMoveParentDown: () => void;
  setChildren: (
    pIdx: number,
    nextChildren: PrimaryMenuChildFormValues[],
  ) => void;
  createEmptyChild: () => PrimaryMenuChildFormValues;
  enforceParentRulesIfHasChildren: (pIdx: number) => void;
}>;

/**
 * Bloc UI d’un item parent du menu principal.
 */
export function PrimaryMenuItemBlock({
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
  onMoveParentUp,
  onMoveParentDown,
  setChildren,
  createEmptyChild,
  enforceParentRulesIfHasChildren,
}: PrimaryMenuItemBlockProps) {
  const parentIdPrefix = `${formIdPrefix}-parent-${pIdx}`;
  const children = parent.children ?? [];

  const renderChildren = (
    <ul className={cn(STACK_MD)}>
      {children.map((_, cIdx) => {
        const childIdPrefix = `${formIdPrefix}-child-${pIdx}-${cIdx}`;

        return (
          <PrimaryMenuChildRow
            key={toStableUiKey({ keyId: `pm-child-${pIdx}-${cIdx}` }, cIdx)}
            pIdx={pIdx}
            cIdx={cIdx}
            control={control}
            trigger={trigger}
            disabled={disabled}
            showError={showError}
            childIdPrefix={childIdPrefix}
            internalPageOptions={internalPageOptions}
            isFirst={cIdx === 0}
            isLast={cIdx === children.length - 1}
            onRemove={() => {
              const next = [...children];
              next.splice(cIdx, 1);
              setChildren(pIdx, next);
              void trigger(`items.${pIdx}.children` as const);
            }}
            onMoveUp={() => {
              if (cIdx <= 0) return;

              const next = [...children];
              const [moved] = next.splice(cIdx, 1);
              next.splice(cIdx - 1, 0, moved);
              setChildren(pIdx, next);
            }}
            onMoveDown={() => {
              if (cIdx >= children.length - 1) return;

              const next = [...children];
              const [moved] = next.splice(cIdx, 1);
              next.splice(cIdx + 1, 0, moved);
              setChildren(pIdx, next);
            }}
          />
        );
      })}
    </ul>
  );

  return (
    <Fragment>
      <div>
        <PrimaryMenuParentRow
          pIdx={pIdx}
          control={control}
          trigger={trigger}
          disabled={disabled}
          showError={showError}
          parentIdPrefix={parentIdPrefix}
          internalPageOptions={internalPageOptions}
          isFirst={pIdx === 0}
          isLast={pIdx === totalParents - 1}
          onRemove={onRemoveParent}
          onMoveUp={onMoveParentUp}
          onMoveDown={onMoveParentDown}
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
        />
      </div>

      {pIdx < totalParents - 1 ? <Separator /> : null}
    </Fragment>
  );
}

PrimaryMenuItemBlock.displayName = "PrimaryMenuItemBlock";
