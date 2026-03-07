"use client";

/**
 * @file apps/studio/src/features/settings/menus/components/molecules/LinkFieldsItem.tsx
 * @layer ui/studio/molecules
 *
 * @description
 * Éditeur de lien (href contrôlé) avec options internes et bascule interne/externe.
 *
 * @remarks
 * - Controlled (sans RHF).
 * - UI-only : normalisation d’édition via `toExternalDraft` / `toInternalDraft`.
 * - S’appuie sur `resolveLinkFlags` pour dériver le mode externe depuis la valeur affichée.
 * - Peut être utilisé par Menu, GalleryMenu (href sur image), etc.
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
import { toExternalDraft, toInternalDraft } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_CENTER, STACK_MD } from "@compoz/ui/styles/studio/layout";

type LinkFieldsItemProps = Readonly<{
  /** Préfixe stable pour générer les IDs ARIA. */
  idPrefix: string;

  /** Source de vérité (controlled). */
  href: string;
  onHrefChange: (next: string) => void;

  /**
   * Optionnel : newTab (utile pour menu, probablement inutile pour gallery menu V0.5).
   * Si absent => on n'affiche pas le switch.
   */
  newTab?: boolean;
  onNewTabChange?: (next: boolean) => void;

  /** Désactive l’édition et les actions. */
  disabled?: boolean;

  /**
   * Si l’item parent a des enfants (groupe) :
   * - on force interne
   * - on désactive certains contrôles
   */
  parentHasChildren?: boolean;

  /** Indicateur visuel/ARIA d’invalidité (complète `error`). */
  invalid?: boolean;
  /** Message d’erreur bloquant affiché sous le champ href. */
  error?: string;

  /** Options de pages internes disponibles (picker). */
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;

  /** Déclenche une validation immédiate côté parent (optionnel). */
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
  onValidateNow,
}: LinkFieldsItemProps) {
  const t = useTranslations();

  const hrefIds = createFieldIds(idPrefix, "href");
  const linkTypeIds = createFieldIds(idPrefix, "linkType");
  const newTabIds = createFieldIds(idPrefix, "newTab");
  const internalPickerIds = internalPageOptions?.length
    ? createFieldIds(idPrefix, "internalPicker")
    : undefined;

  // Valeur source (vue) : si parentHasChildren, on force interne en draft.
  const hrefRaw = !parentHasChildren
    ? String(href ?? "")
    : toInternalDraft(String(href ?? ""));

  // Mode externe dérivé.
  const flags = resolveLinkFlags(hrefRaw);
  const isExternal = flags.rawExternal;

  // Valeur affichée (draft) cohérente avec le mode.
  const hrefDraft = isExternal
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
            // On garde le mode courant (interne/externe), on ne le “devine” pas au milieu d’une saisie.
            const normalized = isExternal
              ? toExternalDraft(value)
              : toInternalDraft(value);

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

              // UX : sur un lien interne, on coupe newTab si dispo.
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

              // Convertit le href courant selon le mode souhaité.
              // On part de la valeur visible (hrefDraft) pour éviter les incohérences.
              const normalized = checked
                ? toExternalDraft(hrefDraft)
                : toInternalDraft(hrefDraft);

              // UX : externe => newTab true par défaut (si dispo).
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
