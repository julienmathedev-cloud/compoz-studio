"use client";

/**
 * @file apps/studio/src/components/molecules/fields/SwitchField.tsx
 * @layer studio/molecules
 *
 * @description
 * Champ Switch contrôlé (label, aide, switch) basé sur les primitives ShadCN.
 *
 * @remarks
 * - Molecule UI : compose `Field`, `Switch`, `HelpText`.
 * - Contrôle via `checked` / `onCheckedChange` fournis par le parent.
 * - L’invalidité est pilotée via `invalid` (ARIA + styles).
 * - Le chargement est géré au niveau Form / Section (ce composant ne gère que `disabled`).
 * - Strictement UI-only : aucune logique métier.
 */

import { HelpText } from "@compoz/studio/components/atoms/typography/HelpText";

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@compoz/ui/components/ui/field";
import { Switch } from "@compoz/ui/components/ui/switch";
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_BETWEEN } from "@compoz/ui/styles/studio/layout";

/**
 * Props du composant `SwitchField`.
 */
type SwitchFieldProps = Readonly<{
  /** Ensemble des IDs ARIA du champ (fournis par le parent). */
  ids: FieldIds;
  /** Libellé affiché à gauche du switch. */
  label: string;
  /** Texte d’aide optionnel sous le label. */
  help?: string;
  /** Valeur actuelle (contrôlée). */
  checked: boolean;
  /** Callback appelé avec le nouvel état. */
  onCheckedChange: (v: boolean) => void;
  /** Désactive toute interaction. */
  disabled?: boolean;
  /** Indicateur visuel/ARIA d’invalidité (complète les erreurs gérées par le parent). */
  invalid?: boolean;
  className?: string;
}>;

/**
 * Champ Switch contrôlé standardisé pour le Studio.
 */
export function SwitchField({
  ids,
  label,
  help,
  checked,
  onCheckedChange,
  disabled,
  invalid,
  className,
}: SwitchFieldProps) {
  const { fieldId, helpId } = ids;

  // Si on a un help + un helpId, on relie le switch à ce texte via aria-describedby
  const describedBy = help && helpId ? helpId : undefined;

  return (
    <Field data-invalid={invalid || undefined} className="min-w-0">
      <div className={cn(ROW_BETWEEN, "h-full min-w-0", className)}>
        {/* Bloc texte (label + description) */}
        <div className="min-w-0">
          <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>

          {help && (
            <FieldDescription>
              <HelpText as="span" id={helpId}>
                {help}
              </HelpText>
            </FieldDescription>
          )}
        </div>

        {/* Switch aligné à droite */}
        <Switch
          id={fieldId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : undefined}
          disabled={disabled}
        />
      </div>
    </Field>
  );
}

SwitchField.displayName = "SwitchField";
