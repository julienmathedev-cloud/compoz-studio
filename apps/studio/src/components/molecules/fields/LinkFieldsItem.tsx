"use client";

/**
 * @file apps/studio/src/components/molecules/fields/LinkFieldsItem.tsx
 * @layer studio/molecules/fields
 *
 * @description
 * Controlled link editor with internal page options and internal/external mode switching.
 *
 * @remarks
 * - Stays React Hook Form agnostic: values are fully controlled by props.
 * - Normalizes editable href drafts through `toExternalDraft` and `toInternalDraft`.
 * - Uses `resolveLinkFlags` to derive external mode from the displayed value.
 * - Reusable for menus, gallery image links, and similar link-editing UIs.
 */

import { useTranslations } from "next-intl";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { SelectField } from "@compoz/studio/components/molecules/fields/SelectField";
import { SwitchField } from "@compoz/studio/components/molecules/fields/SwitchField";
import { MenuBadges } from "@compoz/studio/features/settings/menus/_shared/MenuBadges";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { resolveLinkFlags } from "@compoz/ui/lib/links/helpers";
import {
  normalizeTelAndMailtoHrefDraft,
  toExternalDraft,
  toInternalDraft,
} from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_CENTER, STACK_MD } from "@compoz/ui/styles/studio/layout";

type LinkFieldsItemProps = Readonly<{
  idPrefix: string;
  href: string;
  onHrefChange: (next: string) => void;
  /** Optional `newTab` support; when omitted, the switch is hidden. */
  newTab?: boolean;
  onNewTabChange?: (next: boolean) => void;
  disabled?: boolean;
  /** Parent groups force internal links and disable conflicting controls. */
  parentHasChildren?: boolean;
  invalid?: boolean;
  error?: string;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  allowTelAndMailto?: boolean;
  onValidateNow?: (markTouched?: boolean) => void;
}>;

export function LinkFieldsItem({
  idPrefix,
  href,
  onHrefChange,
  newTab,
  onNewTabChange,
  disabled,
  parentHasChildren = false,
  invalid,
  error,
  internalPageOptions,
  allowTelAndMailto = false,
  onValidateNow,
}: LinkFieldsItemProps) {
  const t = useTranslations();

  const hrefIds = createFieldIds(idPrefix, "href");
  const linkTypeIds = createFieldIds(idPrefix, "linkType");
  const newTabIds = createFieldIds(idPrefix, "newTab");
  const internalPickerIds = internalPageOptions?.length
    ? createFieldIds(idPrefix, "internalPicker")
    : undefined;

  // Parent groups always use internal draft hrefs.
  const hrefRaw = !parentHasChildren
    ? String(href ?? "")
    : toInternalDraft(String(href ?? ""));

  // External mode is derived from the displayed href value.
  const flags = resolveLinkFlags(hrefRaw);
  const isExternal = flags.rawExternal;

  // Displayed draft value stays consistent with the current link mode.
  const specialHrefDraft = allowTelAndMailto
    ? normalizeTelAndMailtoHrefDraft(hrefRaw)
    : null;
  const hrefDraft = specialHrefDraft
    ? toExternalDraft(specialHrefDraft)
    : isExternal
      ? toExternalDraft(hrefRaw)
      : toInternalDraft(hrefRaw);

  const isBusy = Boolean(disabled);

  const disabledHref = isBusy;
  const disabledExternalSwitch = isBusy || parentHasChildren;
  const canShowNewTab =
    typeof newTab === "boolean" && typeof onNewTabChange === "function";
  const disabledNewTab = isBusy || parentHasChildren || !canShowNewTab;

  const canShowInternalPicker =
    Boolean(internalPageOptions?.length) &&
    !isExternal &&
    Boolean(internalPickerIds);

  return (
    <ExpandableLayout
      id={idPrefix}
      label={t("studio.menuLink.expandableLabel")}
      defaultOpen={false}
      disabled={isBusy}
      summary={
        <InputField
          ids={hrefIds}
          label={t("studio.menuLink.href.label")}
          value={hrefDraft}
          onChange={(value) => {
            // Preserve the current internal/external mode while the user is typing.
            const specialDraft = allowTelAndMailto
              ? normalizeTelAndMailtoHrefDraft(value)
              : null;
            const normalized =
              specialDraft !== null
                ? toExternalDraft(specialDraft)
                : isExternal
                  ? toExternalDraft(value)
                  : toInternalDraft(value);

            if (specialDraft !== null && canShowNewTab) {
              onNewTabChange(false);
            }

            onHrefChange(normalized);
          }}
          onBlur={() => {
            onValidateNow?.(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onValidateNow?.(true);
            }
          }}
          placeholder={t("studio.menuLink.href.placeholder")}
          disabled={disabledHref}
          invalid={invalid}
          error={error}
          help={
            parentHasChildren
              ? t("studio.menuLink.hasChildrenHelp")
              : t("studio.menuLink.defaultHelp")
          }
        />
      }
    >
      <div className={cn(STACK_MD)}>
        {canShowInternalPicker ? (
          <SelectField
            ids={internalPickerIds!}
            label={t("studio.menuLink.internalPicker.label")}
            value=""
            onChange={(value) => {
              if (!value) return;

              onHrefChange(String(value));

              // Internal links should not open in a new tab by default.
              if (canShowNewTab) onNewTabChange(false);

              onValidateNow?.(false);
            }}
            items={(internalPageOptions ?? []).map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            placeholder={t("studio.menuLink.internalPicker.placeholder")}
            disabled={disabledHref}
          />
        ) : null}

        <div className={cn(ROW_CENTER)}>
          <SwitchField
            ids={linkTypeIds}
            label={t("studio.menuLink.externalSwitch.label")}
            help={t("studio.menuLink.externalSwitch.help")}
            checked={parentHasChildren ? false : isExternal}
            onCheckedChange={(checked) => {
              if (parentHasChildren) return;

              // Convert from the visible draft value to avoid mode inconsistencies.
              const normalized = checked
                ? toExternalDraft(hrefDraft)
                : toInternalDraft(hrefDraft);

              // External links open in a new tab by default when supported.
              if (canShowNewTab) onNewTabChange(checked === true);

              onHrefChange(normalized);
              onValidateNow?.(false);
            }}
            disabled={disabledExternalSwitch}
          />

          <MenuBadges
            item={{ href: hrefDraft, hasChildren: parentHasChildren }}
          />
        </div>

        {canShowNewTab ? (
          <SwitchField
            ids={newTabIds}
            label={t("studio.menuLink.newTabSwitch.label")}
            help={t("studio.menuLink.newTabSwitch.help")}
            checked={parentHasChildren ? false : Boolean(newTab)}
            onCheckedChange={(value) => {
              if (parentHasChildren) return;
              onNewTabChange(value === true);
            }}
            disabled={disabledNewTab}
          />
        ) : null}
      </div>
    </ExpandableLayout>
  );
}

LinkFieldsItem.displayName = "LinkFieldsItem";
