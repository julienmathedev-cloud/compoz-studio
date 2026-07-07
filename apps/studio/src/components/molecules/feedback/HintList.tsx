"use client";

/**
 * @file apps/studio/src/components/molecules/feedback/HintList.tsx
 * @layer studio/molecules
 *
 * @description
 * Studio hint list for info, warning, success, and error messages.
 *
 * @remarks
 * - Composes the shared `Card` primitive with `StudioIcon` and `Text` atoms.
 * - Styles the `warning` variant locally because ShadCN does not provide one.
 * - Adapts `role` and `aria-live` defaults to the selected variant, with explicit overrides.
 * - Renders `null` when `hints` is empty.
 */

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";

import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { Text } from "@compoz/studio/components/atoms/typography/Text";

import { Card, CardContent, CardHeader } from "@compoz/ui/components/ui/card";
import { toReactListKey } from "@compoz/ui/lib/keys/toReactListKey";
import { cn } from "@compoz/ui/lib/utils";

type Variant = "info" | "warning" | "success" | "error";

export type HintListProps = Readonly<{
  hints?: ReadonlyArray<ReactNode>;
  title?: ReactNode;
  variant?: Variant;
  className?: string;
  role?: "status" | "alert";
  ariaLive?: "polite" | "assertive";
}>;

/** Maps each hint variant to its Lucide icon. */
const ICON_BY_VARIANT: Record<Variant, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
};

function assertNever(x: never): never {
  throw new Error(`Unexpected variant: ${x}`);
}

function alertToneClasses(variant: Variant) {
  switch (variant) {
    case "warning":
      return "border-t-[color:var(--warning-border)]/45 border-b-[color:var(--warning-border)]/55 border-l-[color:var(--warning-border)]/15 border-r-[color:var(--warning-border)]/15 text-warning/70 shadow-warning/15";
    case "success":
    case "info":
      return "text-foreground";
    case "error":
      return "";
    default:
      return assertNever(variant);
  }
}

export function HintList({
  hints = [],
  title,
  variant = "warning",
  className,
  role,
  ariaLive,
}: HintListProps) {
  const titleId = useId();
  const listId = `${titleId}-list`;

  if (hints.length === 0) return null;

  const computedRole: "status" | "alert" =
    role ?? (variant === "error" ? "alert" : "status");

  const live = ariaLive ?? (variant === "error" ? "assertive" : "polite");

  const Icon = ICON_BY_VARIANT[variant];

  return (
    <Card
      variant="panel"
      visualMode="studio"
      className={cn(alertToneClasses(variant), className, "gap-2")}
      aria-live={live}
      role={computedRole}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={listId}
    >
      {title && (
        <CardHeader id={titleId} className="flex items-center gap-2">
          <StudioIcon icon={Icon} className="h-4 w-4" />
          <Text as="p" variant="base">
            {title}
          </Text>
        </CardHeader>
      )}

      <CardContent id={listId}>
        <ul className="list-disc pl-3">
          {hints.map((h, i) => {
            const key =
              typeof h === "string"
                ? `hint-${toReactListKey({ label: h }, i)}`
                : `hint-node-${i}`;

            return (
              <li key={key}>
                <Text as="span" variant="meta">
                  {h}
                </Text>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

HintList.displayName = "HintList";
