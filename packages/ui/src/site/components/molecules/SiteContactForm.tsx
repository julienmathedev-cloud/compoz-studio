"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteContactForm.tsx
 * @layer ui/site/molecules
 *
 * @description
 * Formulaire de contact public utilisé par la cellule `form`.
 *
 * @remarks
 * - UI-only orienté runtime site.
 * - Tous les styles sont pilotés par `ui`.
 * - Le composant supporte deux modes :
 *   1. `onSubmit` fourni par le parent
 *   2. fallback HTTP vers `/api/contact`
 * - Utilise `Card` et les primitives `Field` ShadCN.
 * - Supporte les types `text`, `email` et `textarea`.
 * - Envoie aussi les métadonnées minimales des champs (`name`, `label`)
 *   afin que l’API puisse afficher les champs dynamiques avec un libellé lisible.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";

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
import { renderContentIcon } from "@compoz/ui/lib/icons/content-icons";
import { cn } from "@compoz/ui/lib/utils";
import type { SiteFormUi } from "@compoz/ui/site/site-ui.types";
import type {
  FormCellShape,
  FormFieldShape,
} from "@compoz/validation/pages/blocks/cells/cell";

export type SiteContactFormSubmitValues = Record<string, string>;

type SubmitStatus = "idle" | "success" | "error";
type SubmitButtonIconPosition = "before" | "after";

export type SiteContactFormProps = Readonly<{
  fields: readonly FormFieldShape[];
  submitButton: FormCellShape["submitButton"];
  toEmail: string;
  successMessage?: string | null;
  errorMessage?: string | null;
  ui: SiteFormUi;
  disabled?: boolean;
  onSubmit?: (values: SiteContactFormSubmitValues) => void | Promise<void>;
}>;

export function SiteContactForm({
  fields,
  submitButton,
  toEmail,
  successMessage = "Votre message a bien été envoyé.",
  errorMessage = "Une erreur est survenue lors de l’envoi du message.",
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  useEffect(() => {
    setValues(buildInitialValues(fields));
    setSubmitStatus("idle");
  }, [fields]);

  if (visibleFields.length < 1) {
    return null;
  }

  const isFormDisabled = disabled || isSubmitting;
  const submitLabel = isSubmitting ? "Envoi..." : submitButton.label;

  const submitButtonIconPosition: SubmitButtonIconPosition =
    submitButton.iconPosition === "after" ? "after" : "before";

  const submitContent = renderSubmitButtonContent({
    label: submitLabel,
    icon: submitButton.icon,
    iconPosition: submitButtonIconPosition,
    ui,
  });

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (submitStatus !== "idle") {
      setSubmitStatus("idle");
    }
  };

  const submitWithApi = async (nextValues: SiteContactFormSubmitValues) => {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        toEmail: toEmail.trim(),
        values: nextValues,
        fields: visibleFields.map((field) => ({
          name: field.name,
          label: field.label,
        })),
      }),
    });

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      throw new Error(errorPayload?.error || "Contact form submission failed.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isFormDisabled) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus("idle");

      if (onSubmit) {
        await onSubmit(values);
      } else {
        await submitWithApi(values);
      }

      setValues(buildInitialValues(fields));
      setSubmitStatus("success");
    } catch (error) {
      console.error("SiteContactForm submit error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
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
                    <span>{field.label}</span>
                    {field.required ? (
                      <>
                        <span
                          className="-ml-1 text-destructive"
                          aria-hidden="true"
                        >
                          *
                        </span>
                        <span className="sr-only"> champ obligatoire</span>
                      </>
                    ) : null}
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
                      aria-required={Boolean(field.required)}
                      disabled={isFormDisabled}
                      placeholder={field.placeholder ?? ""}
                      className={cn(ui.textarea)}
                    />
                  ) : (
                    <Input
                      id={field.id}
                      name={field.name}
                      type={field.type === "email" ? "email" : "text"}
                      autoComplete={
                        field.type === "email" ? "email" : undefined
                      }
                      value={value}
                      onChange={(event) =>
                        handleChange(field.name, event.target.value)
                      }
                      required={Boolean(field.required)}
                      aria-required={Boolean(field.required)}
                      disabled={isFormDisabled}
                      placeholder={field.placeholder ?? ""}
                      className={cn(ui.input)}
                    />
                  )}
                </Field>
              );
            })}
          </div>

          {submitStatus === "success" ? (
            <p className="text-sm text-green-600">{successMessage}</p>
          ) : null}

          {submitStatus === "error" ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </CardContent>

        <CardFooter className={cn(ui.footer)}>
          <Button
            type="submit"
            variant={submitButton.variant}
            disabled={isFormDisabled}
            className={cn(ui.submitButton)}
          >
            {submitContent}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

SiteContactForm.displayName = "SiteContactForm";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

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

function renderSubmitButtonContent({
  label,
  icon,
  iconPosition,
  ui,
}: Readonly<{
  label: string;
  icon: FormCellShape["submitButton"]["icon"];
  iconPosition: SubmitButtonIconPosition;
  ui: SiteFormUi;
}>): ReactNode {
  if (!icon) {
    return label;
  }

  const iconNode = renderContentIcon(icon, {
    className: cn(ui.submitButtonUi.icon),
  });

  return (
    <span className={cn(ui.submitButtonUi.content)}>
      {iconPosition === "before" ? iconNode : null}
      <span className={cn(ui.submitButtonUi.label)}>{label}</span>
      {iconPosition === "after" ? iconNode : null}
    </span>
  );
}
