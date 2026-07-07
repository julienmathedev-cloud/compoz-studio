"use client";

/**
 * @file apps/studio/src/components/molecules/fields/SwitchField.tsx
 * @layer studio/molecules/fields
 *
 * @description
 * Controlled Studio switch field with label and optional help text.
 *
 * @remarks
 * - Composes `Field`, `Switch`, and `HelpText`.
 * - The checked state is fully controlled through `checked` and `onCheckedChange`.
 * - Maps `invalid` to ARIA invalid state and visual styles.
 * - Loading state is handled by parent forms or sections; this component only handles `disabled`.
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

type SwitchFieldProps = Readonly<{
  ids: FieldIds;
  name?: string;
  label: string;
  help?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}>;

export function SwitchField({
  ids,
  name,
  label,
  help,
  checked,
  onCheckedChange,
  disabled,
  invalid,
  className,
}: SwitchFieldProps) {
  const { fieldId, helpId } = ids;

  // Link the switch to helper text when a help id is available.
  const describedBy = help && helpId ? helpId : undefined;

  return (
    <Field data-invalid={invalid || undefined} className="min-w-0">
      <div className={cn(ROW_BETWEEN, "h-full min-w-0", className)}>
        {/* Text block: label and optional description. */}
        <div className="min-w-0">
          <FieldLabel visualMode="studio" htmlFor={fieldId}>
            {label}
          </FieldLabel>

          {help && (
            <FieldDescription visualMode="studio">
              <HelpText as="span" id={helpId}>
                {help}
              </HelpText>
            </FieldDescription>
          )}
        </div>

        <Switch
          id={fieldId}
          name={name}
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
