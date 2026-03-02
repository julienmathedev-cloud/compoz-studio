/**
 * @file packages/ui/src/lib/a11y/helpers.ts
 * @layer ui/lib/a11y
 * @description
 * Helpers d’accessibilité pour calculer des attributs ARIA cohérents
 * et éviter la redondance entre texte visible et `aria-label`.
 * Utilisés côté public, admin et preview.
 */

import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";

import { normalizeVisibleText } from "@compoz/ui/lib/normalize";

// Sous-ensemble minimal de props React utilisées pour détecter `aria-hidden`
// lors de l’extraction du texte visible.
type AriaHiddenProps = {
  "aria-hidden"?: boolean | "true" | "false";
  children?: ReactNode;
};

/* -------------------------------------------------------------------------- */
/*                             Visible text helpers                            */
/* -------------------------------------------------------------------------- */

/**
 * Extraire le texte **réellement visible** depuis des children React.
 */
export function getVisibleText(children: ReactNode): string {
  if (
    children === null ||
    children === undefined ||
    typeof children === "boolean"
  ) {
    return "";
  }

  if (typeof children === "string" || typeof children === "number") {
    return normalizeVisibleText(String(children));
  }

  if (Array.isArray(children)) {
    return normalizeVisibleText(children.map(getVisibleText).join(" "));
  }

  if (isValidElement(children)) {
    if (children.type === "br") return " ";

    const el = children as ReactElement<AriaHiddenProps>;
    const ariaHidden = el.props["aria-hidden"];

    if (
      ariaHidden === true ||
      (typeof ariaHidden === "string" && ariaHidden.toLowerCase() === "true")
    ) {
      return "";
    }

    return getVisibleText(el.props.children);
  }

  return "";
}

/* -------------------------------------------------------------------------- */
/*                              Aria-label helper                              */
/* -------------------------------------------------------------------------- */

/**
 * Calculer un `aria-label` pour les éléments interactifs.
 */
export function getAriaLabel(
  ariaLabel: string | undefined,
  children: ReactNode,
  fallback?: string,
): string | undefined {
  const text = getVisibleText(children).trim();

  const normalizedAria = ariaLabel?.trim();
  if (normalizedAria) {
    return normalizedAria !== text ? normalizedAria : undefined;
  }

  if (text) return undefined;

  const normalizedFallback = fallback?.trim();
  return normalizedFallback ? normalizedFallback : undefined;
}
