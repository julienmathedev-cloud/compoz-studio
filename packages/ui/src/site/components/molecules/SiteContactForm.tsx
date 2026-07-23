"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteContactForm.tsx
 * @layer ui/site/components/molecules
 *
 * @description
 * Renders the public contact form used by form cells.
 *
 * @remarks
 * - Supports parent-provided submission or the `/api/contact` fallback.
 * - Sends field metadata so dynamic fields keep readable labels server-side.
 * - Supports select prefill from validated URL query parameters.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@compoz/ui/components/ui/select";
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

  const currentSearch =
    typeof window === "undefined" ? "" : window.location.search;

  useEffect(() => {
    setValues(buildInitialValues(fields));
    setSubmitStatus("idle");
  }, [fields]);

  useEffect(() => {
    const searchParams = new URLSearchParams(currentSearch);

    setValues((previousValues) =>
      applySelectQueryPrefill(fields, previousValues, searchParams),
    );
  }, [currentSearch, fields]);

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
    setValues((previousValues) => ({
      ...previousValues,
      [name]: value,
    }));

    if (submitStatus !== "idle") {
      setSubmitStatus("idle");
    }
  };

  const handleSelectChange = (name: string, nextValue: string) => {
    // Radix Select may emit an empty value while synchronizing a controlled
    // select inside a form, even without a corresponding user interaction.
    if (nextValue === "") {
      return;
    }

    handleChange(name, nextValue);
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

      const submittedValues = toSubmittedValues(visibleFields, values);

      if (onSubmit) {
        await onSubmit(submittedValues);
      } else {
        await submitWithApi(submittedValues);
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

                  {field.type === "select" ? (
                    <Select
                      name={field.name}
                      value={value}
                      onValueChange={(nextValue) =>
                        handleSelectChange(field.name, nextValue)
                      }
                      required={Boolean(field.required)}
                      disabled={isFormDisabled}
                    >
                      <SelectTrigger
                        id={field.id}
                        aria-required={Boolean(field.required)}
                        className={cn("w-full", ui.input)}
                      >
                        <SelectValue placeholder={field.placeholder ?? ""} />
                      </SelectTrigger>

                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : isTextarea ? (
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

/** Applies only declared select values without replacing an existing field value. */
function applySelectQueryPrefill(
  fields: readonly FormFieldShape[],
  values: SiteContactFormSubmitValues,
  searchParams: URLSearchParams,
): SiteContactFormSubmitValues {
  let hasChange = false;
  const output = { ...values };

  for (const field of fields) {
    if (field.type !== "select" || output[field.name] !== "") {
      continue;
    }

    const queryValue = searchParams.get(field.name);

    if (
      !queryValue ||
      !field.options.some((option) => option.value === queryValue)
    ) {
      continue;
    }

    output[field.name] = queryValue;
    hasChange = true;
  }

  return hasChange ? output : values;
}

/** Converts internal select values to their readable labels for submissions. */
function toSubmittedValues(
  fields: readonly FormFieldShape[],
  values: SiteContactFormSubmitValues,
): SiteContactFormSubmitValues {
  const output = { ...values };

  for (const field of fields) {
    if (field.type !== "select") {
      continue;
    }

    const option = field.options.find(
      (candidate) => candidate.value === values[field.name],
    );

    output[field.name] = option?.label ?? "";
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
