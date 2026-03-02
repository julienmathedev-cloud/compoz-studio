"use client";

/**
 * @file apps/studio/src/features/settings/menus/_shared/MenuItem.tsx
 * @layer ui/molecules
 *
 * @description
 * Ligne éditable d’un item de menu (label + lien) pour l’admin.
 *
 * @remarks
 * - Molecule UI : compose `InputField`, `NewMenuLinkFieldsItem` et des actions (move/delete).
 * - RHF-aware : reçoit les `ControllerRenderProps` (fields) fournis par le parent.
 * - le type est dérivé depuis `href` (ex. menu légal).
 * - Strictement UI-only : aucune logique métier.
 */
import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { MENU_ITEM_LAYOUT, ROW_END } from "@compoz/ui/styles/studio/layout";
import { AdminIcon } from "@compoz/studio/components/atoms/AdminIcon";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { AdminButtonGroup } from "@compoz/studio/components/molecules/controls/AdminButtonGroup";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { NewMenuLinkFieldsItem } from "@compoz/studio/features/settings/menus/_shared/NewMenuLinkFieldsItem";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";

type RowErrorMessages = Partial<Record<"label" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"label" | "href", boolean>>;

type RHFField = ControllerRenderProps<FieldValues>;

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
  /** Action : suppression de la ligne. */
  onRemove: () => void;
  /** Action : déplacement vers le haut. */
  onMoveUp: () => void;
  /** Action : déplacement vers le bas. */
  onMoveDown: () => void;
  /** Indique si l’item a des enfants (groupe). */
  hasChildren?: boolean;
  /** Indique si l’item est en première position. */
  isFirst?: boolean;
  /** Indique si l’item est en dernière position. */
  isLast?: boolean;
  /** Désactive l’édition et les actions. */
  disabled?: boolean;
}>;

/**
 * Ligne de formulaire pour éditer un item de menu (admin).
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
  onRemove,
  onMoveUp,
  onMoveDown,
  hasChildren = false,
  isFirst = false,
  isLast = false,
  disabled = false,
}: MenuFieldsItemProps) {
  const labelIds = createFieldIds(idPrefix, "label");
  const linkIdPrefix = `${idPrefix}-link`;
  const t = useTranslations();

  return (
    <div className={cn(MENU_ITEM_LAYOUT)}>
      <InputField
        ids={labelIds}
        inputRef={labelField.ref}
        label={t("admin.menuFieldsItem.labelField.label")}
        value={String(labelField.value ?? "")}
        onChange={(v) => labelField.onChange(v)}
        onBlur={labelField.onBlur}
        placeholder={t("admin.menuFieldsItem.labelField.placeholder")}
        disabled={disabled}
        invalid={invalid?.label}
        error={error?.label}
        help
      />

      <NewMenuLinkFieldsItem
        idPrefix={linkIdPrefix}
        hrefField={hrefField}
        newTabField={newTabField}
        disabled={disabled}
        parentHasChildren={hasChildren}
        invalid={invalid?.href}
        error={error?.href}
        internalPageOptions={internalPageOptions}
        onValidateNow={onHrefValidateNow}
      />

      <div className={cn(ROW_END)}>
        <div className="mt-[1.6rem] flex h-9 items-center">
          <AdminButtonGroup className="shrink-0">
            <TooltipButton
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={disabled || isFirst}
              aria-label={t("common.moveUp")}
              tooltip={
                disabled || isFirst
                  ? disabled
                    ? t("common.actionUnavailable")
                    : t("common.alreadyTop")
                  : t("common.moveUp")
              }
            >
              <AdminIcon icon={ChevronUp} />
            </TooltipButton>

            <TooltipButton
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={disabled || isLast}
              aria-label={t("common.moveDown")}
              tooltip={
                disabled || isLast
                  ? disabled
                    ? t("common.actionUnavailable")
                    : t("common.alreadyBottom")
                  : t("common.moveDown")
              }
            >
              <AdminIcon icon={ChevronDown} />
            </TooltipButton>

            <DeleteButton
              disabled={disabled}
              size="icon"
              onConfirmDelete={onRemove}
              confirm={{
                title: t("admin.menuFieldsItem.confirmDelete.title"),
                description: t(
                  "admin.menuFieldsItem.confirmDelete.description",
                ),
              }}
            />
          </AdminButtonGroup>
        </div>
      </div>
    </div>
  );
}

MenuFieldsItem.displayName = "MenuFieldsItem";
