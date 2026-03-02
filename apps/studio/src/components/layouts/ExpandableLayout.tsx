"use client";

/**
 * @file apps/studio/src/components/layouts/ExpandableLayout.tsx
 * @layer ui/layouts
 *
 * @description
 * Layout repliable (summary + details) basé sur l’Accordion (ShadCN).
 *
 * @remarks
 * - UI-only : ne connaît ni RHF ni le métier.
 * - Réduit la charge visuelle en regroupant des options avancées.
 * - `forceOpen` force l’ouverture de manière one-way (ne referme pas automatiquement).
 * - `onOpenChange` permet une instrumentation optionnelle (debug/analytics).
 */

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@compoz/ui/components/ui/accordion";
import { useIdPrefix } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";

/**
 * Props du composant `ExpandableLayout`.
 */
export type ExpandableLayoutProps = Readonly<{
  /** Entete toujours visible (compact). */
  summary?: ReactNode;

  /** Zone repliable (options). */
  children: ReactNode;

  /** Libellé du toggle. */
  label?: string;

  /** Ouvert par défaut (si non contrôlé). */
  defaultOpen?: boolean;

  /** Désactive le toggle (et donc l’ouverture/fermeture). */
  disabled?: boolean;

  /** État contrôlé (optionnel). Si fourni, le composant devient contrôlé. */
  open?: boolean;

  /** Callback optionnel (instrumentation / debug / analytics). */
  onOpenChange?: (open: boolean) => void;

  /** Identifiant stable (si tu veux une valeur d’accordéon déterministe). */
  id?: string;

  className?: string;

  triggerClassName?: string;
}>;

/**
 * Affiche une zone compacte (`summary`) et une zone repliable (`children`).
 */
export function ExpandableLayout({
  summary,
  children,
  label,
  defaultOpen = false,
  disabled = false,
  open,
  onOpenChange,
  id,
  className,
  triggerClassName,
}: ExpandableLayoutProps) {
  const fallbackId = useIdPrefix("expandable");
  const itemValue = useMemo(() => id ?? fallbackId, [id, fallbackId]);

  // État local (non contrôlé) : `defaultOpen` initialise.
  const [openState, setOpenState] = useState(Boolean(defaultOpen));
  const isControlled = typeof open === "boolean";
  const effectiveOpen = isControlled ? open : openState;

  const t = useTranslations();
  const resolvedLabel = label ?? t("admin.expandable.advancedOptions");

  return (
    <div className={cn(className, "flex flex-col")}>
      {/* Zone compacte toujours visible */}
      {summary && <div>{summary}</div>}

      {/* Zone repliable : encapsulation Accordion shadcn */}
      <Accordion
        type="single"
        collapsible
        value={effectiveOpen ? itemValue : ""}
        onValueChange={(v) => {
          const nextOpen = v === itemValue;

          // Si contrôlé: on notifie seulement
          if (isControlled) {
            onOpenChange?.(nextOpen);
            return;
          }

          // Sinon: état interne
          setOpenState(nextOpen);
          onOpenChange?.(nextOpen);
        }}
      >
        <AccordionItem value={itemValue}>
          <AccordionTrigger
            disabled={disabled}
            className={cn(triggerClassName, "leading-none")}
          >
            {resolvedLabel}
          </AccordionTrigger>

          <AccordionContent>{children}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

ExpandableLayout.displayName = "ExpandableLayout";
