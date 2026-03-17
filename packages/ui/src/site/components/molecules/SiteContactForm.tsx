"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteContactForm.tsx
 * @layer ui/site/molecules
 *
 * @description
 * Formulaire de contact public utilisé par la cellule `form`.
 *
 * @remarks
 * - UI-only.
 * - Tous les styles sont pilotés par `ui`.
 * - Le composant ne gère pas l’envoi réel : il délègue au parent via `onSubmit`.
 * - Utilise `Card` et les primitives `Field` ShadCN.
 * - Supporte les types `text`, `email` et `textarea`.
 */

import { useEffect, useMemo, useState } from "react";

import { Button } from "@compoz/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@compoz/ui/components/ui/card";
import { Field, FieldLabel } from "@compoz/ui/components/ui/field";
import { Input } from "@compoz/ui/components/ui/input";
import { Textarea } from "@compoz/ui/components/ui/textarea";
import { cn } from "@compoz/ui/lib/utils";
import type { SiteFormUi } from "@compoz/ui/site/site-ui.types";
import type { FormFieldShape } from "@compoz/validation/pages/blocks/cells/cell";

export type SiteContactFormSubmitValues = Record<string, string>;

export type SiteContactFormProps = Readonly<{
  fields: readonly FormFieldShape[];
  submitLabel: string;
  ui: SiteFormUi;
  disabled?: boolean;
  onSubmit?: (values: SiteContactFormSubmitValues) => void | Promise<void>;
}>;

export function SiteContactForm({
  fields,
  submitLabel,
  ui,
  disabled = false,
  onSubmit,
}: SiteContactFormProps) {
  const visibleFields = useMemo(
    () => fields.filter((field) => field.name?.trim() && field.label?.trim()),
    [fields],
  );

  const [values, setValues] = useState<SiteContactFormSubmitValues>(() =>
    buildInitialValues(fields),
  );

  useEffect(() => {
    setValues(buildInitialValues(fields));
  }, [fields]);

  if (visibleFields.length < 1) {
    return null;
  }

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit?.(values);
  };

  return (
    <Card className={cn(ui.card)}>
      <form className={cn(ui.form)} onSubmit={handleSubmit}>
        <CardHeader className={cn(ui.header)} />

        <CardContent className={cn(ui.content)}>
          <div className={cn(ui.fields)}>
            {visibleFields.map((field) => {
              const value = values[field.name] ?? "";
              const isTextarea = field.type === "textarea";

              return (
                <Field key={field.id} className={cn(ui.field)}>
                  <FieldLabel htmlFor={field.id} className={cn(ui.label)}>
                    {field.label}
                  </FieldLabel>

                  {isTextarea ? (
                    <Textarea
                      id={field.id}
                      name={field.name}
                      value={value}
                      onChange={(event) =>
                        handleChange(field.name, event.target.value)
                      }
                      required={Boolean(field.required)}
                      disabled={disabled}
                      placeholder={field.placeholder ?? ""}
                      className={cn(ui.textarea)}
                    />
                  ) : (
                    <Input
                      id={field.id}
                      name={field.name}
                      type={field.type === "email" ? "email" : "text"}
                      value={value}
                      onChange={(event) =>
                        handleChange(field.name, event.target.value)
                      }
                      required={Boolean(field.required)}
                      disabled={disabled}
                      placeholder={field.placeholder ?? ""}
                      className={cn(ui.input)}
                    />
                  )}
                </Field>
              );
            })}
          </div>
        </CardContent>

        <CardFooter className={cn(ui.footer)}>
          <Button
            type="submit"
            disabled={disabled}
            className={cn(ui.submitButton)}
          >
            {submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

SiteContactForm.displayName = "SiteContactForm";

function buildInitialValues(
  fields: readonly FormFieldShape[],
): SiteContactFormSubmitValues {
  const output: SiteContactFormSubmitValues = {};

  for (const field of fields) {
    if (!field.name?.trim()) {
      continue;
    }

    output[field.name] = "";
  }

  return output;
}
