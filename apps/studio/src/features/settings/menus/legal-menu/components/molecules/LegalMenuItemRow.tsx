"use client";

/**
 * @file apps/studio/src/features/settings/legal-menu/components/organisms/LegalMenuForm.tsx
 * @layer ui/molecules
 * @description
 * Composant représentant une ligne d'item dans le formulaire du menu légal.
 * Il gère les champs label, href et newTab en utilisant react-hook-form.
 *
 * @remarks
 * - Utilise `useController` pour connecter les champs au formulaire RHF.
 * - Gère la validation et l'affichage des erreurs pour chaque champ.
 * - Permet la validation immédiate du champ href lors de changements programmatiques.
 */
import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { resolveLinkFlags, slugifyPath } from "@compoz/ui/lib/links/helpers";
import type { LegalMenuFormValues } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";
import { MenuFieldsItem } from "@compoz/studio/features/settings/menus/_shared/MenuFieldsItem";
import {
  useController,
  type Control,
  type UseFormTrigger,
} from "react-hook-form";

// Types UI locaux (erreurs / invalid par champ).
type RowErrorMessages = Partial<Record<"label" | "href", string | undefined>>;
type RowInvalidFlags = Partial<Record<"label" | "href", boolean>>;

/**
 * Props de la row RHF (un item du menu).
 */
type LegalMenuItemRowProps = Readonly<{
  index: number;
  control: Control<LegalMenuFormValues>;
  trigger: UseFormTrigger<LegalMenuFormValues>;
  disabled: boolean;
  showError: boolean;
  rowIdPrefix: string;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}>;

/**
 * Row RHF (un item) — obligatoire pour appeler `useController`.
 *
 * @remarks
 * - Construit `invalid` / `error` depuis `fieldState`.
 * - Déclenche une validation immédiate du href lors des changements programmatiques.
 */
export function LegalMenuItemRow({
  index,
  control,
  trigger,
  disabled,
  showError,
  rowIdPrefix,
  internalPageOptions,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
}: LegalMenuItemRowProps) {
  const labelCtrl = useController({
    name: `items.${index}.label` as const,
    control,
  });

  const hrefCtrl = useController({
    name: `items.${index}.href` as const,
    control,
  });

  const newTabCtrl = useController({
    name: `items.${index}.newTab` as const,
    control,
  });

  // ── Identity-style invalid + messages (via fieldState) ───────────────────────
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

  /**
   * ✅ Pour href : permet de forcer la validation immédiatement
   * après un changement programmatique (select interne).
   */
  const validateHrefNow = (markTouched?: boolean) => {
    if (disabled) return;
    if (markTouched) {
      hrefCtrl.field.onBlur(); // ✅ touche uniquement quand c’est un vrai blur/enter
    }
    void trigger(`items.${index}.href` as const);
  };

  return (
    <MenuFieldsItem
      idPrefix={rowIdPrefix}
      disabled={disabled}
      isFirst={isFirst}
      isLast={isLast}
      internalPageOptions={internalPageOptions}
      onRemove={onRemove}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      // ── RHF fields (Option A) ───────────────────────────────────────────────
      labelField={{
        name: labelCtrl.field.name,
        value: labelCtrl.field.value,
        onChange: labelCtrl.field.onChange,
        onBlur: () =>
          handleLabelBlur(
            index,
            labelCtrl.field,
            hrefCtrl.field,
            hrefCtrl.fieldState.isTouched,
            trigger,
          ),
        ref: labelCtrl.field.ref,
      }}
      hrefField={hrefCtrl.field}
      newTabField={newTabCtrl.field}
      // ── validation / affichage erreurs ─────────────────────────────────────
      invalid={invalid}
      error={error}
      // pour href : blur “normal” + actions programmatiques
      onHrefValidateNow={validateHrefNow}
    />
  );
}

/**
 * Gere le blur du label pour l’auto-fill interne.
 */
function handleLabelBlur(
  index: number,
  labelField: {
    value: unknown;
    onBlur: () => void;
    onChange: (value: string) => void;
  },
  hrefField: {
    value: unknown;
    onBlur: () => void;
    onChange: (value: string) => void;
  },
  hrefTouched: boolean,
  trigger: UseFormTrigger<LegalMenuFormValues>,
) {
  // 1) RHF normal : touched + validation "onBlur" du label
  labelField.onBlur();

  if (hrefTouched) return;

  // 2) Conditions d’auto-fill (interne uniquement)
  const hrefNow = String(hrefField.value ?? "");
  const flags = resolveLinkFlags(hrefNow);

  if (flags.rawExternal) return;

  const label = String(labelField.value ?? "").trim();
  if (!label) return;

  const currentHref = hrefNow.trim();

  // item ajouté avec "/" par défaut
  const isEmptyInternalDraft = currentHref === "" || currentHref === "/";
  if (!isEmptyInternalDraft) return;

  const slug = slugifyPath(label);
  if (!slug) return;

  const nextHref = `/${slug}`;
  if (currentHref === nextHref) return;

  hrefField.onChange(nextHref);

  // 3) recommandé : déclenche la validation du href tout de suite
  void trigger(`items.${index}.href` as const);
}
