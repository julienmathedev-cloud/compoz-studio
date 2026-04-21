"use client";

/**
 * @file apps/studio/src/components/molecules/fields/ColorPickerField.tsx
 * @layer ui/studio/molecules
 *
 * @description
 * Field studio pour l’édition d’une couleur :
 * - label / help / error via `InputField`
 * - input HEX
 * - aperçu couleur (swatch)
 * - bouton ghost icon-only
 * - popover avec `ColorPicker`
 *
 * @remarks
 * - HEX only (V1).
 * - Sans alpha.
 * - Sans pipette.
 * - UI-only.
 */

import { Palette } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  ColorPicker,
  isValidHex,
  normalizeHex,
} from "@compoz/studio/components/molecules/fields/ColorPicker";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { Button } from "@compoz/ui/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@compoz/ui/components/ui/popover";
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";

type ColorPickerFieldProps = Readonly<{
  ids: FieldIds;
  name?: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  help?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}>;

export function ColorPickerField({
  ids,
  name,
  label,
  value,
  onChange,
  onBlur,
  help,
  placeholder = "#000000",
  disabled = false,
  invalid = false,
  error,
  required = false,
  className,
}: ColorPickerFieldProps) {
  const normalizedValue = useMemo(() => normalizeHex(value), [value]);
  const [draft, setDraft] = useState(normalizedValue);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDraft(normalizedValue);
  }, [normalizedValue]);

  const commitDraft = () => {
    const normalized = isValidHex(draft)
      ? normalizeHex(draft)
      : normalizedValue;

    setDraft(normalized);
    onChange(normalized);
    onBlur?.();
  };

  const handlePickerChange = (next: string) => {
    const normalized = normalizeHex(next);
    setDraft(normalized);
    onChange(normalized);
  };

  return (
    <div className={cn("min-w-0", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-2">
          <InputField
            ids={ids}
            name={name}
            label={label}
            value={draft}
            onChange={(next) => {
              setDraft(next);

              if (isValidHex(next)) {
                onChange(normalizeHex(next));
              }
            }}
            onBlur={commitDraft}
            placeholder={placeholder}
            help={help}
            disabled={disabled}
            invalid={invalid}
            error={error}
            required={required}
            className="min-w-0"
          />

          <PopoverAnchor asChild>
            <div className="flex items-start gap-2">
              <button
                type="button"
                disabled={disabled}
                aria-label={label}
                title={normalizedValue}
                onClick={() => setOpen(true)}
                className={cn(
                  "mt-[24px] h-10 w-10 shrink-0 rounded-md border border-border shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  disabled && "pointer-events-none opacity-50",
                )}
                style={{ backgroundColor: normalizedValue }}
              />

              <Button
                type="button"
                variant="ghost"
                visualMode="studio"
                size="icon"
                disabled={disabled}
                aria-label={label}
                title={label}
                onClick={() => setOpen(true)}
                className="mt-[28px] shrink-0"
              >
                <Palette className="size-4" />
              </Button>
            </div>
          </PopoverAnchor>
        </div>

        <PopoverContent className="w-[320px] p-4" align="end">
          <ColorPicker
            value={normalizedValue}
            disabled={disabled}
            onChange={handlePickerChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

ColorPickerField.displayName = "ColorPickerField";
