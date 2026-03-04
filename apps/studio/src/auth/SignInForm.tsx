"use client";

/**
 * @file apps/studio/src/app/[locale]/signin/SignInForm.tsx
 * @layer app/auth
 * @description
 * Formulaire de connexion (Client):
 * - state email/password
 * - appel Auth.js via signIn("credentials")
 * - redirection vers nextPath
 */

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";

import { ErrorText } from "@compoz/studio/components/atoms/typography/ErrorText";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import {
  createFieldIds,
  useIdPrefix,
} from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_CONTAINER, ADMIN_PAGE } from "@compoz/ui/styles/studio/layout";

type SignInFormProps = Readonly<{
  locale: string;
  nextPath: string;
}>;

type FieldErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export function SignInForm({ nextPath }: SignInFormProps) {
  const t = useTranslations();

  const idPrefix = useIdPrefix("signin-form");
  const emailIds = createFieldIds(idPrefix, "email");
  const passwordIds = createFieldIds(idPrefix, "password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors.email = t("admin.login.errors.emailRequired");
    if (!password.trim())
      nextErrors.password = t("admin.login.errors.passwordRequired");
    return nextErrors;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: nextPath,
      });

      if (!res) {
        setErrors({ form: t("admin.login.errors.unexpected") });
        return;
      }

      if (res.error) {
        const code = String(res.error);

        if (code.includes("EMAIL_NOT_FOUND")) {
          setErrors({ email: t("admin.login.errors.emailNotFound") });
          return;
        }

        if (code.includes("INVALID_PASSWORD")) {
          setErrors({ password: t("admin.login.errors.invalidPassword") });
          return;
        }

        // fallback si NextAuth renvoie "CredentialsSignin"
        setErrors({ form: t("admin.login.errors.invalidCredentials") });
        return;
      }

      window.location.href = res.url ?? nextPath;
    });
  }

  return (
    <main className={cn("min-h-dvh", ADMIN_CONTAINER, ADMIN_PAGE)}>
      <section
        aria-label={t("admin.login.ariaLabel")}
        className={cn("flex flex-1 mx-auto items-center justify-center")}
      >
        <Card variant="panel" className={cn("w-[420px]")}>
          <CardContent className={cn("space-y-8")}>
            <Heading as="h1" className="text-center">
              {t("admin.login.title")}
            </Heading>

            <Text variant="muted" className="text-center">
              {t("admin.login.tagline")}
            </Text>

            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              <InputField
                ids={emailIds}
                label={t("admin.login.email")}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  if (errors.email || errors.form) {
                    setErrors((prev) => ({
                      ...prev,
                      email: undefined,
                      form: undefined,
                    }));
                  }
                }}
                error={errors.email}
                invalid={Boolean(errors.email)}
              />

              <InputField
                ids={passwordIds}
                label={t("admin.login.password")}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  if (errors.password || errors.form) {
                    setErrors((prev) => ({
                      ...prev,
                      password: undefined,
                      form: undefined,
                    }));
                  }
                }}
                error={errors.password}
                invalid={Boolean(errors.password)}
              />

              {errors.form ? <ErrorText error={errors.form} /> : null}

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? t("admin.login.pending") : t("admin.login.signin")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
