"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/components/molecules/PrimaryMenuItemRow.tsx
 * @layer ui/molecules
 * @description
 * Composant représentant une ligne d'item dans le formulaire du menu principal.
 * Il gère les champs label, href et newTab en utilisant react-hook-form.
 *
 * @remarks
 * - Utilise `useController` pour connecter les champs au formulaire RHF.
 * - Gère la validation et l'affichage des erreurs pour chaque champ.
 * - Permet la validation immédiate du champ href lors de changements programmatiques.
 */
import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import { resolveLinkFlags, slugifyPath } from "@compoz/ui/lib/links/helpers";
import type { PrimaryMenuFormValues } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { MenuFieldsItem } from "@compoz/studio/features/settings/menus/_shared/MenuFieldsItem";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type {
  Control,
  ControllerRenderProps,
  UseFormTrigger,
} from "react-hook-form";
import { useController, useWatch } from "react-hook-form";

// Types UI locaux (erreurs / invalid par champ).
type RowErrorMessages = Partial<Record<"label" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"label" | "href", boolean>>;

/**
 * Props de la row parent (un item du menu principal).
 */
type ParentRowProps = Readonly<{
  pIdx: number;
  control: Control<PrimaryMenuFormValues>;
  trigger: UseFormTrigger<PrimaryMenuFormValues>;
  disabled: boolean;
  showError: boolean;
  parentIdPrefix: string;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;

  /** Ajoute un sous-lien au parent courant. */
  onAddChild: () => void;

  /** Rendu des sous-liens (déjà construit par le parent). */
  renderChildren: ReactNode;

  /** Nombre de sous-liens. */
  childrenCount: number;
}>;

/**
 * Row RHF (parent) — obligatoire pour appeler `useController`.
 */
export function PrimaryMenuParentRow({
  pIdx,
  control,
  trigger,
  disabled,
  showError,
  parentIdPrefix,
  internalPageOptions,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddChild,
  renderChildren,
  childrenCount,
}: ParentRowProps) {
  const labelCtrl = useController({
    name: `items.${pIdx}.label` as const,
    control,
  });

  const hrefCtrl = useController({
    name: `items.${pIdx}.href` as const,
    control,
  });

  const newTabCtrl = useController({
    name: `items.${pIdx}.newTab` as const,
    control,
  });

  const children =
    useWatch({
      control,
      name: `items.${pIdx}.children` as const,
    }) ?? [];
  const hasChildren = children.length > 0;

  const t = useTranslations();

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
    void trigger(`items.${pIdx}.href` as const);
  };

  const handleLabelBlur = () => {
    labelCtrl.field.onBlur();

    // Pas d’auto-href si parent a des enfants
    if (hasChildren) return;

    // Option 1 : on déduit le mode externe depuis `href`
    const hrefNow = String(hrefCtrl.field.value ?? "");
    const flags = resolveLinkFlags(hrefNow);
    if (flags.rawExternal) return;

    const label = String(labelCtrl.field.value ?? "").trim();
    if (!label) return;

    // Si href a déjà été touché, on ne force pas l’auto-fill
    if (hrefCtrl.fieldState.isTouched) return;

    const currentHref = hrefNow.trim();
    const isEmptyInternalDraft = currentHref === "" || currentHref === "/";

    if (!isEmptyInternalDraft) return;

    const slug = slugifyPath(label);
    if (!slug) return;

    hrefCtrl.field.onChange(`/${slug}`);
    void trigger(`items.${pIdx}.href` as const);
  };

  const addChildDisabled = Boolean(disabled);

  return (
    <>
      <MenuFieldsItem
        idPrefix={parentIdPrefix}
        disabled={disabled}
        isFirst={isFirst}
        isLast={isLast}
        internalPageOptions={internalPageOptions}
        onRemove={onRemove}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        hasChildren={hasChildren}
        labelField={
          {
            ...labelCtrl.field,
            onBlur: handleLabelBlur,
          } as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.label`
          >
        }
        hrefField={
          hrefCtrl.field as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.href`
          >
        }
        newTabField={
          newTabCtrl.field as ControllerRenderProps<
            PrimaryMenuFormValues,
            `items.${number}.newTab`
          >
        }
        // Pas de `isExternalField` : le mode est dérivé depuis `href`.
        invalid={invalid}
        error={error}
        onHrefValidateNow={validateHrefNow}
      />

      <ExpandableLayout
        id={`${parentIdPrefix}-children`}
        label={
          childrenCount > 0
            ? t("admin.primaryMenuForm.children.labelWithCount", {
                count: childrenCount,
              })
            : t("admin.primaryMenuForm.children.label")
        }
        disabled={disabled}
      >
        <div className="m-2">
          {childrenCount === 0 ? (
            <AddEmptyCardButton
              onClick={onAddChild}
              disabled={addChildDisabled}
              ariaLabel={t("common.addSubLink")}
              tooltip={t("common.addSubLink")}
              disabledTooltip={t(
                "admin.primaryMenuForm.children.tooltips.unavailableWhileBusy",
              )}
              compact
            />
          ) : (
            <Card
              variant="panel"
              className="bg-accent/10 shadow-xs shadow-accent"
            >
              <CardContent className="flex flex-col gap-2">
                {renderChildren}

                <Separator />

                {/* ✅ Toujours le dernier item : "Ajouter un sous-lien" */}
                <AddEmptyCardButton
                  onClick={onAddChild}
                  disabled={addChildDisabled}
                  ariaLabel={t("common.addSubLink")}
                  tooltip={t("common.addSubLink")}
                  disabledTooltip={t(
                    "admin.primaryMenuForm.children.tooltips.unavailableWhileBusy",
                  )}
                  compact
                />
              </CardContent>
            </Card>
          )}
        </div>
      </ExpandableLayout>
    </>
  );
}

PrimaryMenuParentRow.displayName = "PrimaryMenuParentRow";
