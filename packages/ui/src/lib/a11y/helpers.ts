/**
 * @file packages/ui/src/lib/a11y/helpers.ts
 * @layer ui/lib/a11y
 * @description Accessibility helpers for deriving visible text and avoiding redundant ARIA labels.
 * @remarks
 * Shared by public, admin, and preview UI surfaces.
 */

import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";

import { normalizeVisibleText } from "@compoz/ui/lib/normalize";

// Minimal React props subset used when skipping aria-hidden subtrees.
type AriaHiddenProps = {
  "aria-hidden"?: boolean | "true" | "false";
  children?: ReactNode;
};

function isAriaHidden(value: AriaHiddenProps["aria-hidden"]): boolean {
  if (value === true) return true;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

/** Extracts normalized visible text from React children while skipping aria-hidden subtrees. */
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
    // Skip empty segments before normalizing whitespace across siblings.
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

/** Returns an aria-label only when visible text is missing or the provided label adds information. */
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
