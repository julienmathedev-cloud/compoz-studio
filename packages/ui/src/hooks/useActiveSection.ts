"use client";

/**
 * @file packages/ui/src/hooks/useActiveSection.ts
 * @layer ui/hooks
 *
 * @description
 * Hook détectant la section active parmi une liste d’identifiants.
 *
 * @remarks
 * - Supporte le conteneur de scroll du draft via `[data-scroll-root]`.
 * - Utilise `window` comme fallback pour les sites publiés.
 * - Observe les mutations du DOM pour prendre en charge le rendu différé.
 */

import { useEffect, useState } from "react";

import {
  normalizePath,
  resolveInternalHref,
  resolveLinkFlags,
} from "@compoz/ui/lib/links/helpers";

export function useActiveSection(sectionIds: readonly string[]): string | null {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const sectionIdsKey = sectionIds.join("\u0000");

  useEffect(() => {
    if (sectionIds.length === 0) {
      setActiveSectionId(null);
      return;
    }

    const scrollRoot =
      document.querySelector<HTMLElement>("[data-scroll-root]");
    const observedElements = new Set<HTMLElement>();

    const updateActiveSection = () => {
      const activationLine = scrollRoot
        ? scrollRoot.getBoundingClientRect().top + scrollRoot.clientHeight * 0.35
        : window.innerHeight * 0.35;

      let nextActiveId: string | null = null;

      const sections = sectionIds
        .map((sectionId) => document.getElementById(sectionId))
        .filter((element): element is HTMLElement => Boolean(element))
        .sort(
          (left, right) =>
            left.getBoundingClientRect().top -
            right.getBoundingClientRect().top,
        );

      for (const section of sections) {
        if (section.getBoundingClientRect().top > activationLine) break;

        nextActiveId = section.id;
      }

      setActiveSectionId(nextActiveId);
    };

    const intersectionObserver = new IntersectionObserver(
      updateActiveSection,
      {
        root: scrollRoot,
        rootMargin: "-35% 0px -45% 0px",
        threshold: 0,
      },
    );

    const observeTargets = () => {
      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId);
        if (!element) continue;

        if (observedElements.has(element)) continue;

        observedElements.add(element);
        intersectionObserver.observe(element);
      }

      updateActiveSection();
    };

    observeTargets();

    const mutationObserver = new MutationObserver(() => {
      observeTargets();
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [sectionIds, sectionIdsKey]);

  return activeSectionId;
}

export function collectSectionIds(
  items: ReadonlyArray<{
    href?: string | null;
    children?: ReadonlyArray<{
      href?: string | null;
    } | null> | null;
  }>,
  pathname: string,
): string[] {
  const sectionIds = new Set<string>();

  const addHref = (href?: string | null) => {
    const normalizedHref = href?.trim() ?? "";
    const flags = resolveLinkFlags(normalizedHref);
    if (!normalizedHref || flags.rawExternal || flags.unsafe) return;

    const hashIndex = normalizedHref.indexOf("#");
    if (hashIndex < 0) return;

    const targetPath = normalizedHref.startsWith("#")
      ? normalizePath(pathname)
      : normalizePath(resolveInternalHref(pathname, normalizedHref));

    if (targetPath !== normalizePath(pathname)) return;

    const fragment = normalizedHref.slice(hashIndex + 1);
    if (!fragment) return;

    try {
      sectionIds.add(decodeURIComponent(fragment));
    } catch {
      // noop
    }
  };

  for (const item of items) {
    addHref(item.href);

    for (const child of item.children ?? []) {
      addHref(child?.href);
    }
  }

  return Array.from(sectionIds);
}
