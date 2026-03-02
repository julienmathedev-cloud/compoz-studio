"use client";

/**
 * @file apps/studio/src/components/molecules/feedback/HintList.tsx
 * @layer ui/molecules
 *
 * @description
 * Liste de messages d’aide (info, warning, success, error) basée sur l’Alert ShadCN.
 *
 * @remarks
 * - Molecule UI : compose `Alert` (ShadCN) et des atoms (`AdminIcon`, `Text`).
 * - Le variant `warning` est stylé localement (ShadCN ne le fournit pas).
 * - Accessibilité : `role` / `aria-live` adaptés selon la variante (override possible).
 * - Ne rend rien si `hints` est vide.
 * - Strictement UI-only : aucune logique métier.
 */

import { Card, CardContent, CardHeader } from "@compoz/ui/components/ui/card";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import { AdminIcon } from "@compoz/studio/components/atoms/AdminIcon";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useId, type ReactNode } from "react";

/**
 * Variantes disponibles pour les messages.
 */
type Variant = "info" | "warning" | "success" | "error";

/**
 * Props du composant `HintList`.
 */
export type HintListProps = Readonly<{
  /** Messages à afficher (chaque item peut être un string ou du JSX). */
  hints?: ReadonlyArray<ReactNode>;
  /** Titre optionnel affiché dans l’en-tête. */
  title?: ReactNode;
  /** Variante visuelle et sémantique (défaut: `"warning"`). */
  variant?: Variant;
  /** Classes additionnelles appliquées au conteneur. */
  className?: string;
  /** Rôle ARIA (override). */
  role?: "status" | "alert";
  /** Politique d’annonce ARIA (override). */
  ariaLive?: "polite" | "assertive";
}>;

/** Mapping `Variant` → icône Lucide. */
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
      return "border-t-[color:var(--warning-border)]/45 border-b-[color:var(--warning-border)]/55 text-warning/70 shadow-warning/15";
    case "success":
    case "info":
      return "text-foreground";
    case "error":
      return "";
    default:
      return assertNever(variant);
  }
}

/**
 * Affiche une liste de hints standardisée (admin).
 */
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
      className={cn(alertToneClasses(variant), className, "gap-2")}
      aria-live={live}
      role={computedRole}
    >
      {title && (
        <CardHeader id={titleId} className="flex items-center gap-2">
          <AdminIcon icon={Icon} className="h-4 w-4" />
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
                ? `hint-${toStableUiKey({ label: h }, i)}`
                : `hint-${i}`;
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
