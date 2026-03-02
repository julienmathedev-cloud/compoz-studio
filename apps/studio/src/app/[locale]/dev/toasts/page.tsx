"use client";

/**
 * @file apps/studio/src/app/[locale]/dev/toasts/page.tsx
 * @layer app/studio/dev
 * @description
 * Dev-only — matrice de boutons pour tester rapidement les toasts
 * (UI tokens + domain error codes + scénarios HTTP).
 */

import { useMemo } from "react";

import type { ErrorCode } from "@compoz/core/domain/errors/codes";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { statusFromCode } from "@compoz/infra/http/error-adapter";
import { HttpError } from "@compoz/infra/lib/api-fetch";
import { Button } from "@compoz/ui/components/ui/button";
import { notify } from "@compoz/studio/lib/ui/notify";
import type { UiErrorToken } from "@compoz/studio/lib/ui/uiError";
import { UiError } from "@compoz/studio/lib/ui/uiError";

const DEV_ONLY = process.env.NODE_ENV !== "production";

/** UI tokens qui représentent des statuts HTTP (donc à tester via HttpError). */
const UI_HTTP_TOKENS = [
  UiError.http400,
  UiError.http401,
  UiError.http403,
  UiError.http404,
  UiError.http405,
  UiError.http409,
  UiError.http422,
  UiError.http500,
] as const satisfies readonly UiErrorToken[];

/** Mapping token HTTP -> status (pour matcher le runtime). */
const UI_HTTP_STATUS: Record<(typeof UI_HTTP_TOKENS)[number], number> = {
  [UiError.http400]: 400,
  [UiError.http401]: 401,
  [UiError.http403]: 403,
  [UiError.http404]: 404,
  [UiError.http405]: 405,
  [UiError.http409]: 409,
  [UiError.http422]: 422,
  [UiError.http500]: 500,
};

type MatrixButton = Readonly<{
  key: string;
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "outline" | "destructive";
}>;

function Section({
  title,
  buttons,
}: Readonly<{ title: string; buttons: ReadonlyArray<MatrixButton> }>) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => (
          <Button
            key={b.key}
            type="button"
            variant={b.variant ?? "outline"}
            size="sm"
            onClick={b.onClick}
          >
            {b.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

function uniqSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function isUiHttpToken(
  token: string | UiErrorToken,
): token is (typeof UI_HTTP_TOKENS)[number] {
  return (UI_HTTP_TOKENS as readonly string[]).includes(token);
}

export default function ToastMatrixPage() {
  const uiTokens = useMemo(() => {
    const tokens = Object.values(UiError).filter(
      (v): v is UiErrorToken => typeof v === "string" && v.trim().length > 0,
    );
    return uniqSorted(tokens);
  }, []);

  const domainCodes = useMemo(() => {
    const codes = Object.values(ERROR_CODES).filter(
      (v): v is ErrorCode => typeof v === "string" && v.trim().length > 0,
    );
    return uniqSorted(codes);
  }, []);

  if (!DEV_ONLY) return null;

  const baseButtons: MatrixButton[] = [
    {
      key: "base.success",
      label: "success()",
      variant: "secondary",
      onClick: () => notify.success("Success title", "Success description"),
    },
    {
      key: "base.info",
      label: "info()",
      variant: "secondary",
      onClick: () => notify.info("Info title", "Info description"),
    },
    {
      key: "base.warning",
      label: "warning()",
      variant: "secondary",
      onClick: () => notify.warning("Warning title", "Warning description"),
    },
    {
      key: "base.error",
      label: "error()",
      variant: "destructive",
      onClick: () => notify.error("Error title", "Error description"),
    },
  ];

  const scenarioButtons: MatrixButton[] = [
    {
      key: "scenario.abort",
      label: "fromError → abort",
      onClick: () =>
        notify.fromError(new DOMException("Aborted", "AbortError")),
    },
    {
      key: "scenario.validation",
      label: "fromError → VALIDATION_ERROR (422)",
      variant: "destructive",
      onClick: () =>
        notify.fromError(
          new HttpError(ERROR_CODES.VALIDATION_ERROR, {
            status: statusFromCode(ERROR_CODES.VALIDATION_ERROR),
            code: ERROR_CODES.VALIDATION_ERROR,
          }),
        ),
    },
    {
      key: "scenario.http404",
      label: "fromError → 404",
      onClick: () =>
        notify.fromError(
          new HttpError(UiError.http404, {
            status: 404,
            code: UiError.http404,
          }),
        ),
    },
    {
      key: "scenario.http500",
      label: "fromError → 500",
      variant: "destructive",
      onClick: () =>
        notify.fromError(
          new HttpError(UiError.http500, {
            status: 500,
            code: UiError.http500,
          }),
        ),
    },
    {
      key: "scenario.domain",
      label: "fromError → domain (SOCIAL_DUPLICATE_KIND)",
      variant: "destructive",
      onClick: () => {
        const code = ERROR_CODES.SOCIAL_DUPLICATE_KIND;
        notify.fromError(
          new HttpError(code, { status: statusFromCode(code), code }),
        );
      },
    },
  ];

  /**
   * UI tokens :
   * - tokens HTTP => test via HttpError(status) (comme en prod)
   * - le reste => test via Error(token)
   */
  const uiButtons: MatrixButton[] = uiTokens.map((token) => {
    const isHttp = isUiHttpToken(token);
    return {
      key: `ui.${token}`,
      label: isHttp ? `ui http: ${token}` : `ui: ${token}`,
      variant:
        isHttp && UI_HTTP_STATUS[token] >= 500 ? "destructive" : "outline",
      onClick: () => {
        if (isHttp) {
          const status = UI_HTTP_STATUS[token];
          notify.fromError(new HttpError(token, { status, code: token }));
          return;
        }
        notify.fromError(new Error(token));
      },
    };
  });

  /**
   * Domain codes : status résolu comme côté API (adapter).
   */
  const domainButtons: MatrixButton[] = domainCodes.map((code) => ({
    key: `domain.${code}`,
    label: `domain: ${code}`,
    onClick: () => {
      const status = statusFromCode(code);
      notify.fromError(new HttpError(code, { status, code }));
    },
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">Toast Matrix (dev-only)</h1>
        <p className="text-sm text-muted-foreground">
          UI tokens (réaliste via HttpError pour HTTP), Domain codes (status
          réel via adapter), et scénarios fromError.
        </p>
      </header>

      <Section title="Base" buttons={baseButtons} />
      <Section title="Scénarios (notify.fromError)" buttons={scenarioButtons} />
      <Section title="UI tokens (UiError.*)" buttons={uiButtons} />
      <Section title="Domain codes (ERROR_CODES.*)" buttons={domainButtons} />
    </div>
  );
}
