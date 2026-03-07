"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/components/molecules/PrimaryMenuChildRow.tsx
 * @layer ui/studio/molecules
 * @description
 * Composant représentant une ligne d’item dans le formulaire du menu principal.
 * Il gère les champs `label`, `href` et `newTab` en utilisant react-hook-form.
 *
 * @remarks
 * - Utilise `useController` pour connecter les champs au formulaire RHF.
 * - Gère la validation et l’affichage des erreurs pour chaque champ.
 * - Permet la validation immédiate du champ `href` lors de changements programmatiques.
 */

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { MenuFieldsItem } from "@compoz/studio/features/settings/menus/_shared/MenuFieldsItem";
import { Separator } from "@compoz/ui/components/ui/separator";
import { resolveLinkFlags, slugifyPath } from "@compoz/ui/lib/links/helpers";
import type { PrimaryMenuFormValues } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";
import type {
  Control,
  ControllerRenderProps,
  UseFormTrigger,
} from "react-hook-form";
import { useController } from "react-hook-form";

// Types UI locaux (erreurs / invalid par champ).
type RowErrorMessages = Partial<Record<"label" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"label" | "href", boolean>>;

/**
 * Props de la row enfant (sous-lien d’un parent).
 */
type ChildRowProps = Readonly<{
  pIdx: number;
  cIdx: number;
  control: Control<PrimaryMenuFormValues>;
  trigger: UseFormTrigger<PrimaryMenuFormValues>;
  disabled: boolean;
  showError: boolean;
  childIdPrefix: string;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}>;

/**
 * Row RHF (enfant) — obligatoire pour appeler `useController`.
 */
export function PrimaryMenuChildRow({
  pIdx,
  cIdx,
  control,
  trigger,
  disabled,
  showError,
  childIdPrefix,
  internalPageOptions,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ChildRowProps) {
  const labelCtrl = useController({
    name: `items.${pIdx}.children.${cIdx}.label` as const,
    control,
  });

  const hrefCtrl = useController({
    name: `items.${pIdx}.children.${cIdx}.href` as const,
    control,
  });

  const newTabCtrl = useController({
    name: `items.${pIdx}.children.${cIdx}.newTab` as const,
    control,
  });

  const invalid: RowInvalidFlags = {
    label:
      (showError || labelCtrl.fieldState.isTouched) &&
      Boolean(labelCtrl.fieldState.error?.message),
    href:
      (showError || hrefCtrl.fieldState.isTouched) &&
      Boolean(hrefCtrl.fieldState.error?.message),
  };

  const error: RowErrorMessages = {
    label:
      (showError || labelCtrl.fieldState.isTouched) &&
      labelCtrl.fieldState.error?.message
        ? String(labelCtrl.fieldState.error.message)
        : undefined,
    href:
      (showError || hrefCtrl.fieldState.isTouched) &&
      hrefCtrl.fieldState.error?.message
        ? String(hrefCtrl.fieldState.error.message)
        : undefined,
  };

  const validateHrefNow = (markTouched?: boolean) => {
    if (markTouched) {
      hrefCtrl.field.onBlur();
    }

    void trigger(`items.${pIdx}.children.${cIdx}.href` as const);
  };

  const handleLabelBlur = () => {
    labelCtrl.field.onBlur();

    // Option 1 : externe dérivé depuis href
    const hrefNow = String(hrefCtrl.field.value ?? "");
    const flags = resolveLinkFlags(hrefNow);

    if (flags.rawExternal) return;

    const label = String(labelCtrl.field.value ?? "").trim();
    if (!label) return;

    if (hrefCtrl.fieldState.isTouched) return;

    const currentHref = hrefNow.trim();
    const isEmptyInternalDraft = currentHref === "" || currentHref === "/";

    if (!isEmptyInternalDraft) return;

    const slug = slugifyPath(label);
    if (!slug) return;

    hrefCtrl.field.onChange(`/${slug}`);
    void trigger(`items.${pIdx}.children.${cIdx}.href` as const);
  };

  return (
    <li>
      <MenuFieldsItem
        idPrefix={childIdPrefix}
        disabled={disabled}
        isFirst={isFirst}
        isLast={isLast}
        internalPageOptions={internalPageOptions}
        onRemove={onRemove}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        hasChildren={false}
        labelField={
          {
            ...labelCtrl.field,
            onBlur: handleLabelBlur,
          } as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.children.${number}.label`
          >
        }
        hrefField={
          hrefCtrl.field as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.children.${number}.href`
          >
        }
        newTabField={
          newTabCtrl.field as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.children.${number}.newTab`
          >
        }
        invalid={invalid}
        error={error}
        onHrefValidateNow={validateHrefNow}
      />
      {!isLast ? <Separator aria-hidden="true" /> : null}
    </li>
  );
}
