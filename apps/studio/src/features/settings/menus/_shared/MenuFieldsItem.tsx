"use client";

/**
 * @file apps/studio/src/features/settings/menus/_shared/MenuItem.tsx
 * @layer ui/studio/molecules
 *
 * @description
 * Ligne éditable d’un item de menu (label + lien) pour le studio.
 *
 * @remarks
 * - Molecule UI : compose `InputField`, `LinkFieldsItem` et des actions.
 * - RHF-aware : reçoit les `ControllerRenderProps` (fields) fournis par le parent.
 * - Le type est dérivé depuis `href` (ex. menu légal).
 * - Strictement UI-only : aucune logique métier.
 */

import { useTranslations } from "next-intl";
import type { ComponentPropsWithoutRef } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { LinkFieldsItem } from "@compoz/studio/components/molecules/fields/LinkFieldsItem";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { MENU_ITEM_LAYOUT, ROW_END } from "@compoz/ui/styles/studio/layout";

type RowErrorMessages = Partial<Record<"label" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"label" | "href", boolean>>;

type RHFField = ControllerRenderProps<FieldValues>;

type DragHandleProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "type" | "children"
>;

/**
 * Props du composant `MenuFieldsItem`.
 */
type MenuFieldsItemProps = Readonly<{
  idPrefix: string;

  /** Champ RHF contrôlé : label. */
  labelField: RHFField;
  /** Champ RHF contrôlé : href. */
  hrefField: RHFField;
  /** Champ RHF contrôlé : newTab. */
  newTabField: RHFField;
  /** Options de pages internes disponibles (Select). */
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  /** Flags d’invalidité par champ. */
  invalid?: RowInvalidFlags;
  /** Messages d’erreur par champ. */
  error?: RowErrorMessages;
  /** Déclenche une validation immédiate du champ href côté parent. */
  onHrefValidateNow?: (markTouched?: boolean) => void;
  /** Props du handle de drag injectées par `useSortable`. */
  dragHandleProps?: DragHandleProps;
  /** Action : suppression de la ligne. */
  onRemove: () => void;
  /** Indique si l’item a des enfants (groupe). */
  hasChildren?: boolean;
  /** Désactive l’édition et les actions. */
  disabled?: boolean;
}>;

/**
 * Ligne de formulaire pour éditer un item de menu (studio).
 */
export function MenuFieldsItem({
  idPrefix,
  labelField,
  hrefField,
  newTabField,
  invalid,
  error,
  internalPageOptions,
  onHrefValidateNow,
  dragHandleProps,
  onRemove,
  hasChildren = false,
  disabled = false,
}: MenuFieldsItemProps) {
  const labelIds = createFieldIds(idPrefix, "label");
  const linkIdPrefix = `${idPrefix}-link`;
  const t = useTranslations();

  return (
    <div className={cn("grid grid-cols-[auto_1fr] gap-3")}>
      <div className="pt-[2.2rem]">
        <DragHandle
          className={cn(disabled && "pointer-events-none opacity-50")}
          disabled={disabled}
          {...dragHandleProps}
        />
      </div>

      <div className={cn(MENU_ITEM_LAYOUT)}>
        <InputField
          ids={labelIds}
          inputRef={labelField.ref}
          label={t("studio.menuFieldsItem.labelField.label")}
          value={String(labelField.value ?? "")}
          onChange={(v) => labelField.onChange(v)}
          onBlur={labelField.onBlur}
          placeholder={t("studio.menuFieldsItem.labelField.placeholder")}
          disabled={disabled}
          invalid={invalid?.label}
          error={error?.label}
          help
        />

        <LinkFieldsItem
          idPrefix={linkIdPrefix}
          href={String(hrefField.value ?? "")}
          onHrefChange={(next) => {
            hrefField.onChange(next);
          }}
          newTab={Boolean(newTabField.value)}
          onNewTabChange={(next) => {
            newTabField.onChange(next);
          }}
          disabled={disabled}
          parentHasChildren={hasChildren}
          invalid={invalid?.href}
          error={error?.href}
          internalPageOptions={internalPageOptions}
          onValidateNow={(markTouched) => {
            if (markTouched) {
              hrefField.onBlur();
              newTabField.onBlur?.();
            }

            onHrefValidateNow?.(markTouched);
          }}
        />

        <div className={cn(ROW_END)}>
          <div className="mt-[1.6rem] flex h-9 items-center">
            <DeleteButton
              disabled={disabled}
              size="icon"
              onConfirmDelete={onRemove}
              confirm={{
                title: t("studio.menuFieldsItem.confirmDelete.title"),
                description: t(
                  "studio.menuFieldsItem.confirmDelete.description",
                ),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

MenuFieldsItem.displayName = "MenuFieldsItem";
