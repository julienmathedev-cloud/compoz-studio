"use client";

/**
 * @file apps/studio/src/features/settings/social/components/molecules/SocialFieldsItem.tsx
 * @layer ui/molecules
 *
 * @description
 * Ligne éditable d’un lien social (plateforme + href + actions) pour l’admin.
 *
 * @remarks
 * - Molecule UI : compose `SelectField`, `NewSocialLinkField` et des actions (move/delete).
 * - RHF-aware : reçoit les `ControllerRenderProps` (`kindField`, `hrefField`) fournis par le parent.
 * - Le `href` est stocké sous forme canonique :
 *   - email : `mailto:...`
 *   - url : `https://...`
 * - Le parent pilote la validation (via `onHrefValidateNow`).
 * - Strictement UI-only : aucune logique métier.
 */

import { SOCIAL_KIND_EMAIL } from "@compoz/core/constants/social/social-kinds";
import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { StudioButtonGroup } from "@compoz/studio/components/molecules/controls/StudioButtonGroup";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { NewSocialLinkField } from "@compoz/studio/features/settings/social/components/molecules/NewSocialLinkField";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import {
  buildSocialKindSelectItems,
  normalizeSocialKind,
} from "@compoz/ui/lib/social/social-kind-icons";
import { cn } from "@compoz/ui/lib/utils";
import { MENU_ITEM_LAYOUT, ROW_END } from "@compoz/ui/styles/studio/layout";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";

type RowErrorMessages = Partial<Record<"kind" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"kind" | "href", boolean>>;

type RHFField = ControllerRenderProps<FieldValues, string>;

/**
 * Props du composant `SocialFieldsItem`.
 */
type SocialFieldsItemProps = Readonly<{
  /** Préfixe stable pour générer les IDs ARIA (fournis au `Field`). */
  idPrefix: string;

  /** Champ RHF contrôlé : plateforme (kind). */
  kindField: RHFField;
  /** Champ RHF contrôlé : href canonique (mailto:/https://). */
  hrefField: RHFField;

  /** Flags d’invalidité par champ. */
  invalid?: RowInvalidFlags;
  /** Messages d’erreur par champ. */
  error?: RowErrorMessages;

  /** Déclenche une validation immédiate du champ href côté parent. */
  onHrefValidateNow?: (markTouched?: boolean) => void;
  /** Override optionnel : reset href lors du switch email/url. */
  onHrefClearBySwitch?: () => void;

  /** Action : suppression de la ligne. */
  onRemove: () => void;
  /** Action : déplacement vers le haut. */
  onMoveUp: () => void;
  /** Action : déplacement vers le bas. */
  onMoveDown: () => void;

  /** Indique si l’item est en première position. */
  isFirst?: boolean;
  /** Indique si l’item est en dernière position. */
  isLast?: boolean;
  /** Désactive l’édition et les actions. */
  disabled?: boolean;
}>;

/**
 * Extrait la partie affichable à partir d’un href canonique.
 */
function stripCanonicalPrefix(value: string, isEmail: boolean): string {
  const v = String(value ?? "").trim();
  if (!v) return "";

  if (isEmail) {
    return v.toLowerCase().startsWith("mailto:")
      ? v.slice("mailto:".length)
      : v;
  }

  if (v.toLowerCase().startsWith("https://")) return v.slice("https://".length);
  if (v.toLowerCase().startsWith("http://")) return v.slice("http://".length);

  return v;
}

/**
 * Reconstruit un href canonique à partir de la valeur saisie.
 */
function buildCanonicalHref(raw: string, isEmail: boolean): string {
  const input = String(raw ?? "").trim();
  if (!input) return "";

  if (isEmail) {
    const lower = input.toLowerCase();
    return lower.startsWith("mailto:") ? input : `mailto:${input}`;
  }

  const lower = input.toLowerCase();
  if (lower.startsWith("https://")) return input;
  if (lower.startsWith("http://"))
    return `https://${input.slice("http://".length)}`;

  return `https://${input}`;
}

/**
 * Ligne UI pour éditer un lien social (admin).
 */
export function SocialFieldsItem({
  idPrefix,
  kindField,
  hrefField,
  invalid,
  error,
  onHrefValidateNow,
  onHrefClearBySwitch,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  disabled = false,
}: SocialFieldsItemProps) {
  const kindIds = createFieldIds(idPrefix, "kind");
  const hrefIds = createFieldIds(idPrefix, "href");
  const t = useTranslations();

  const kindValue = normalizeSocialKind(String(kindField.value ?? ""));
  const hrefCanonical = String(hrefField.value ?? "");
  const isEmail = kindValue === SOCIAL_KIND_EMAIL;

  const hrefDisplay = stripCanonicalPrefix(hrefCanonical, isEmail);
  const selectItems = useMemo(
    () => buildSocialKindSelectItems((key) => t(key)),
    [t],
  );

  const validateHrefNow = () => {
    onHrefValidateNow?.(true);
  };

  const clearHrefBySwitch = () => {
    if (onHrefClearBySwitch) {
      onHrefClearBySwitch();
      return;
    }
    hrefField.onChange("");
  };

  return (
    <div className={cn(MENU_ITEM_LAYOUT)}>
      <SelectField
        ids={kindIds}
        label={t("studio.socialFieldsItem.kind.label")}
        value={kindValue}
        onChange={(v) => {
          const prevKind = kindValue;
          const nextKind = normalizeSocialKind(String(v));

          const prevIsEmail = prevKind === SOCIAL_KIND_EMAIL;
          const nextIsEmail = nextKind === SOCIAL_KIND_EMAIL;

          kindField.onChange(nextKind);

          if (prevIsEmail !== nextIsEmail) {
            clearHrefBySwitch();
          }
        }}
        items={selectItems}
        placeholder={t("studio.socialFieldsItem.kind.placeholder")}
        disabled={disabled}
        invalid={invalid?.kind}
        error={error?.kind}
        help={t("studio.socialFieldsItem.kind.help")}
      />

      <NewSocialLinkField
        ids={hrefIds}
        isEmail={isEmail}
        value={hrefDisplay}
        onChange={(raw) => {
          hrefField.onChange(buildCanonicalHref(raw, isEmail));
        }}
        onBlur={validateHrefNow}
        invalid={invalid?.href}
        error={error?.href}
        disabled={disabled}
        placeholderEmail={t("studio.socialFieldsItem.href.placeholderEmail")}
        placeholderUrl={t("studio.socialFieldsItem.href.placeholderUrl")}
        helpEmail={t("studio.socialFieldsItem.href.helpEmail")}
        helpUrl={t("studio.socialFieldsItem.href.helpUrl")}
      />

      <div className={cn(ROW_END)}>
        <div className="mt-[1.6rem] flex h-9 items-center">
          <StudioButtonGroup className="shrink-0">
            <TooltipButton
              type="button"
              variant="ghost"
              visualMode="studio"
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
              <StudioIcon icon={ChevronUp} />
            </TooltipButton>

            <TooltipButton
              type="button"
              variant="ghost"
              visualMode="studio"
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
              <StudioIcon icon={ChevronDown} />
            </TooltipButton>

            <DeleteButton
              size="icon"
              disabled={disabled}
              onConfirmDelete={onRemove}
              confirm={{
                title: t("studio.socialFieldsItem.confirmDelete.title"),
                description: t(
                  "studio.socialFieldsItem.confirmDelete.description",
                ),
              }}
            />
          </StudioButtonGroup>
        </div>
      </div>
    </div>
  );
}

SocialFieldsItem.displayName = "SocialFieldsItem";
