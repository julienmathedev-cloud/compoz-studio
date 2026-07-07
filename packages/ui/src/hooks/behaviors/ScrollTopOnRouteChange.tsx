"use client";

/**
 * @file packages/ui/src/hooks/behaviors/ScrollTopOnRouteChange.tsx
 * @layer ui/hooks/behaviors
 * @description Forces immediate top scroll on Next App Router navigation.
 * @remarks
 * Disables browser scroll restoration and supports a custom `[data-scroll-root]`; hash targets still use smooth anchor scrolling when available.
 */

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { scrollToElement } from "@compoz/ui/lib/scrollToElement";

type ScrollRoot = Window | HTMLElement;

function getScrollRoot(): ScrollRoot {
  if (typeof document === "undefined") {
    return window;
  }

  const root = document.querySelector<HTMLElement>("[data-scroll-root]");
  return root ?? window;
}

function isWindowScrollRoot(root: ScrollRoot): root is Window {
  return typeof Window !== "undefined" && root instanceof Window;
}

/** Returns the element that actually owns `scroll-behavior` for the active scroll root. */
function getScrollBehaviorTarget(root: ScrollRoot): HTMLElement | null {
  if (typeof document === "undefined") return null;

  if (isWindowScrollRoot(root)) {
    return document.documentElement;
  }

  return root;
}

/** Temporarily disables smooth scrolling to keep inter-page navigation immediate. */
function scrollRootToTopImmediate(): void {
  if (typeof window === "undefined") return;

  const root = getScrollRoot();
  const behaviorTarget = getScrollBehaviorTarget(root);
  const previousInlineScrollBehavior =
    behaviorTarget?.style.scrollBehavior ?? "";

  if (behaviorTarget) {
    behaviorTarget.style.scrollBehavior = "auto";
  }

  if (isWindowScrollRoot(root)) {
    root.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  } else {
    root.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    root.scrollTop = 0;
  }

  /** Restore smooth scrolling after the browser has applied the immediate scroll. */
  window.requestAnimationFrame(() => {
    if (!behaviorTarget) return;

    if (previousInlineScrollBehavior) {
      behaviorTarget.style.scrollBehavior = previousInlineScrollBehavior;
      return;
    }

    behaviorTarget.style.removeProperty("scroll-behavior");
  });
}

function getHashTarget(): HTMLElement | null {
  const hash = window.location.hash;
  if (!hash) return null;

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

function scrollToHashTargetWhenReady(): (() => void) | null {
  if (!window.location.hash) return null;

  const scrollToTarget = (): boolean => {
    const target = getHashTarget();
    if (!target) return false;

    scrollToElement(target);
    return true;
  };

  if (scrollToTarget()) return null;

  const observer = new MutationObserver(() => {
    if (!scrollToTarget()) return;

    observer.disconnect();
    window.clearTimeout(timeoutId);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const timeoutId = window.setTimeout(() => {
    observer.disconnect();
    scrollRootToTopImmediate();
  }, 3000);

  return () => {
    observer.disconnect();
    window.clearTimeout(timeoutId);
  };
}

export function ScrollTopOnRouteChange() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`;

  useEffect(() => {
    if (typeof history === "undefined") return;

    try {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
    } catch {
      // noop
    }

    return () => {
      try {
        if ("scrollRestoration" in history) {
          history.scrollRestoration = "auto";
        }
      } catch {
        // noop
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cleanupHashTarget: (() => void) | null = null;

    const timeoutId = window.setTimeout(() => {
      const raf1 = window.requestAnimationFrame(() => {
        const raf2 = window.requestAnimationFrame(() => {
          cleanupHashTarget = scrollToHashTargetWhenReady();
          if (window.location.hash) {
            return;
          }

          scrollRootToTopImmediate();
        });

        void raf2;
      });

      void raf1;
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      cleanupHashTarget?.();
    };
  }, [routeKey]);

  return null;
}

ScrollTopOnRouteChange.displayName = "ScrollTopOnRouteChange";
