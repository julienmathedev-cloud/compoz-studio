"use client";

/**
 * @file apps/studio/src/features/demo/DemoStartLoader.tsx
 * @layer studio/features/demo
 *
 * @description
 * Client loader shown while provisioning a demo sandbox.
 *
 * @remarks
 * - Starts demo provisioning through `/api/demo/start?mode=json` and redirects only to safe same-origin paths.
 * - Uses simulated progress capped below completion until the API confirms the sandbox is ready.
 * - Supports retry by changing `attempt`, which restarts the provisioning request and progress animation.
 */

import { Check, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";

type DemoStartResponse = Readonly<{
  ok?: boolean;
  redirectTo?: string;
}>;

const STEPS = [
  "Copie du site",
  "Configuration de la session",
  "Ouverture du Studio",
] as const;

function normalizeRedirectTo(value: unknown): string {
  const redirectTo = String(value ?? "").trim();

  if (
    !redirectTo ||
    !redirectTo.startsWith("/") ||
    redirectTo.startsWith("//")
  ) {
    return "/";
  }

  return redirectTo;
}

export function DemoStartLoader() {
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  const activeStep = useMemo(() => {
    if (progress >= 82) return 2;
    if (progress >= 44) return 1;
    return 0;
  }, [progress]);

  useEffect(() => {
    if (!isStarting) {
      return;
    }

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) {
          return current;
        }

        return Math.min(
          92,
          current + Math.max(1, Math.round((92 - current) / 9)),
        );
      });
    }, 420);

    return () => window.clearInterval(timer);
  }, [isStarting, attempt]);

  useEffect(() => {
    const controller = new AbortController();

    async function startDemo() {
      setError(null);
      setIsStarting(true);
      setProgress(12);

      try {
        const res = await fetch("/api/demo/start?mode=json", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
          headers: {
            accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Demo start failed (${res.status}).`);
        }

        const payload = (await res.json()) as DemoStartResponse;
        const redirectTo = normalizeRedirectTo(payload.redirectTo);

        if (payload.ok !== true) {
          throw new Error("Demo start returned an invalid response.");
        }

        setProgress(100);
        window.setTimeout(() => {
          window.location.assign(redirectTo);
        }, 260);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to start demo sandbox.", err);

        setIsStarting(false);
        setError("Impossible de préparer la démo pour le moment.");
      }
    }

    void startDemo();

    return () => controller.abort();
  }, [attempt]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 text-foreground">
      <section
        aria-label="Préparation de la démo"
        className="w-full max-w-[520px] space-y-8"
      >
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-md border border-primary/15 bg-primary/5 text-primary">
            <Loader2
              aria-hidden="true"
              className={cn("size-5", isStarting ? "animate-spin" : "")}
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground">
              Préparation de votre espace démo...
            </h1>

            <p className="text-sm leading-6 text-muted-foreground">
              Nous copions le site de démonstration et configurons votre
              session.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div
            aria-label="Progression de la préparation"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            role="progressbar"
            className="h-2 overflow-hidden rounded-sm bg-muted"
          >
            <div
              className="h-full rounded-sm bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, index) => {
              const isDone = index < activeStep || progress === 100;
              const isCurrent = index === activeStep && progress < 100;

              return (
                <li
                  key={step}
                  className={cn(
                    "flex min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-sm",
                    isDone
                      ? "border-primary/20 bg-primary/5 text-foreground"
                      : isCurrent
                        ? "border-primary/25 bg-background text-foreground"
                        : "border-border bg-background text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-sm border text-[11px]",
                      isDone
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {isDone ? (
                      <Check aria-hidden="true" className="size-3" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="min-w-0 truncate">{step}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {error ? (
          <div className="space-y-4 rounded-md border border-destructive/25 bg-destructive/5 p-4 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>

            <Button
              type="button"
              variant="outline"
              visualMode="studio"
              onClick={() => setAttempt((value) => value + 1)}
              className="gap-2"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Réessayer
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

DemoStartLoader.displayName = "DemoStartLoader";
