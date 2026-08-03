"use client";

/**
 * @file apps/studio/src/features/settings/social/components/molecules/SocialFieldsItem.tsx
 * @layer studio/features/settings/social/components/molecules
 *
 * @description
 * Editable studio row for one social link platform, canonical href, and row actions.
 *
 * @remarks
 * - Receives RHF controller fields from the parent so list state and validation stay centralized.
 * - Stores href values in canonical form: `mailto:` for email links and `https://` for URL links.
 */

import { SOCIAL_KIND_EMAIL } from "@compoz/core/constants/social/social-kinds";
import { DeleteButton } from "@compoz/studio/components/atoms/buttons/DeleteButton";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { DragHandle } from "@compoz/studio/features/dnd/DragHandle";
import { NewSocialLinkField } from "@compoz/studio/features/settings/social/components/molecules/NewSocialLinkField";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import {
  buildSocialKindSelectItems,
  normalizeSocialKind,
} from "@compoz/ui/lib/social/social-kind-icons";
import { cn } from "@compoz/ui/lib/utils";
import { MENU_ITEM_LAYOUT, ROW_END } from "@compoz/ui/styles/studio/layout";
import { useTranslations } from "next-intl";
import { useMemo, type ComponentPropsWithoutRef } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";

type RowErrorMessages = Partial<Record<"kind" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"kind" | "href", boolean>>;

type RHFField = ControllerRenderProps<FieldValues, string>;

type DragHandleProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "type" | "children"
>;

type SocialFieldsItemProps = Readonly<{
  idPrefix: string;

  kindField: RHFField;
  hrefField: RHFField;

  invalid?: RowInvalidFlags;
  error?: RowErrorMessages;

  /** Lets the parent trigger href validation after link-field interactions. */
  onHrefValidateNow?: (markTouched?: boolean) => void;
  /** Allows the parent to keep PATCH semantics when switching between email and URL modes. */
  onHrefClearBySwitch?: () => void;

  dragHandleProps?: DragHandleProps;
  onRemove: () => void;
  disabled?: boolean;
}>;

/** Converts a canonical social href into the editable value shown in the input. */
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

/** Rebuilds the canonical social href from the editable input value. */
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

export function SocialFieldsItem({
  idPrefix,
  kindField,
  hrefField,
  invalid,
  error,
  onHrefValidateNow,
  onHrefClearBySwitch,
  dragHandleProps,
  onRemove,
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
    <div className={cn("grid grid-cols-[auto_1fr] gap-3")}>
      <div className="pt-[2.2rem]">
        <DragHandle
          className={cn(disabled && "pointer-events-none opacity-50")}
          disabled={disabled}
          {...dragHandleProps}
        />
      </div>

      <div className={cn(MENU_ITEM_LAYOUT)}>
        <SelectField
          ids={kindIds}
          name={kindField.name}
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
          name={hrefField.name}
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
          </div>
        </div>
      </div>
    </div>
  );
}

SocialFieldsItem.displayName = "SocialFieldsItem";
