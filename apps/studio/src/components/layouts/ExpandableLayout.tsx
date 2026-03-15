"use client";

/**
 * @file apps/studio/src/components/layouts/ExpandableLayout.tsx
 * @layer studio/layouts
 *
 * @description
 * Layout repliable (summary + details) basé sur l’Accordion (ShadCN).
 *
 * @remarks
 * - UI-only : ne connaît ni RHF ni le métier.
 * - Réduit la charge visuelle en regroupant des options avancées.
 * - `forceClosed` force une fermeture temporaire one-way (ex: pendant un drag parent).
 * - `open` permet un mode contrôlé optionnel.
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
  /** Entête toujours visible (compact). */
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

  /**
   * Force une fermeture temporaire sans perdre l’état local.
   *
   * @remarks
   * Typiquement utile pendant un drag parent pour éviter que des zones
   * droppables enfants restent actives/visibles.
   */
  forceClosed?: boolean;

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
  forceClosed = false,
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

  /**
   * Priorité d’ouverture :
   * 1. forceClosed => toujours fermé
   * 2. mode contrôlé => `open`
   * 3. mode non contrôlé => état local
   */
  const effectiveOpen = forceClosed
    ? false
    : isControlled
      ? Boolean(open)
      : openState;

  const t = useTranslations();
  const resolvedLabel = label ?? t("studio.expandable.advancedOptions");

  return (
    <div className={cn(className, "flex flex-col")}>
      {summary ? <div>{summary}</div> : null}

      <Accordion
        type="single"
        collapsible
        value={effectiveOpen ? itemValue : ""}
        onValueChange={(v) => {
          const nextOpen = v === itemValue;

          // Si fermeture forcée, on ignore les interactions utilisateur.
          if (forceClosed) {
            onOpenChange?.(false);
            return;
          }

          if (isControlled) {
            onOpenChange?.(nextOpen);
            return;
          }

          setOpenState(nextOpen);
          onOpenChange?.(nextOpen);
        }}
      >
        <AccordionItem value={itemValue}>
          <AccordionTrigger
            disabled={disabled || forceClosed}
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
