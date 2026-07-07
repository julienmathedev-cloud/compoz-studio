"use client";

/**
 * @file packages/ui/src/hooks/useHeaderHeightVar.ts
 * @layer ui/hooks
 * @description Synchronizes a measured header height into a CSS variable.
 * @remarks
 * Uses `ResizeObserver` when available and can write either on the root, the header element, or a custom target.
 */

import { useEffect, useRef, type RefObject } from "react";
type HeaderHeightVarOptions =
  | { enabled?: boolean; varName?: string; target?: "root" }
  | { enabled?: boolean; varName?: string; target: "element" }
  | { enabled?: boolean; varName?: string; target: HTMLElement | null };

export function useHeaderHeightVar(
  options?: HeaderHeightVarOptions,
): RefObject<HTMLElement | null> {
  const {
    enabled = true,
    varName = "--header-h",
    target = "root",
  } = options ?? {};

  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof document === "undefined") return;

    const headerEl = ref.current;
    if (!headerEl) return;

    const styleTarget =
      target === "root"
        ? document.documentElement
        : target === "element"
          ? headerEl
          : target || document.documentElement;

    const apply = () => {
      const h = Math.round(headerEl.getBoundingClientRect().height);
      styleTarget.style.setProperty(varName, `${h}px`);
    };

    apply();

    // Test and non-browser fallback: apply once when ResizeObserver is unavailable.
    if (typeof ResizeObserver === "undefined") {
      return () => {
        if (styleTarget !== document.documentElement) {
          styleTarget.style.removeProperty(varName);
        }
      };
    }

    const ro = new ResizeObserver(apply);
    ro.observe(headerEl);

    return () => {
      ro.disconnect();
      if (styleTarget !== document.documentElement) {
        styleTarget.style.removeProperty(varName);
      }
    };
  }, [enabled, varName, target]);

  return ref;
}
