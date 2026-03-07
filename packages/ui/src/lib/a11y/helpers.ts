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
 * Retourne `true` si la valeur de `aria-hidden` indique explicitement
 * que l’élément (et donc ses children) ne doit pas être considéré comme visible.
 */
function isAriaHidden(value: AriaHiddenProps["aria-hidden"]): boolean {
  if (value === true) return true;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

/**
 * Extraire le texte **réellement visible** depuis des children React.
 *
 * Notes :
 * - ignore `null` / `undefined` / `boolean`
 * - convertit `string` / `number` en texte normalisé
 * - ignore les sous-arbres `aria-hidden`
 * - traite `<br />` comme un séparateur d’espace
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
    // Évite de concaténer des segments vides et réduit le bruit (espaces multiples).
    const parts = children
      .map(getVisibleText)
      .map((s) => s.trim())
      .filter(Boolean);

    return normalizeVisibleText(parts.join(" "));
  }

  if (isValidElement(children)) {
    if (children.type === "br") return " ";

    const el = children as ReactElement<AriaHiddenProps>;
    if (isAriaHidden(el.props["aria-hidden"])) return "";

    return getVisibleText(el.props.children);
  }

  return "";
}

/* -------------------------------------------------------------------------- */
/*                              Aria-label helper                              */
/* -------------------------------------------------------------------------- */

/**
 * Calculer un `aria-label` pour les éléments interactifs.
 *
 * Règles :
 * - si `ariaLabel` est fourni et différent du texte visible → on le garde
 * - si `ariaLabel` est fourni mais identique au texte visible → on l’omet (évite la redondance)
 * - si le texte visible existe → pas besoin d’aria-label
 * - sinon on utilise `fallback` si présent
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
