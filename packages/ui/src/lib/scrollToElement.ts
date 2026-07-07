/**
 * @file packages/ui/src/lib/scrollToElement.ts
 * @layer ui/lib/scroll
 * @description Scrolls to DOM elements while accounting for the sticky header offset.
 * @remarks
 * Uses `--header-h` as the default offset and avoids `scrollIntoView()` so both `window` and `[data-scroll-root]` scrolling can be offset consistently.
 */

import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";

export type ScrollToElementBlock = "start" | "center";

export type ScrollToElementOptions = Readonly<{
  behavior?: ScrollBehavior;
  offset?: number;
  block?: ScrollToElementBlock;
}>;

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

/** Reads the sticky header offset from `--header-h`, returning `0` when unavailable. */
export function getHeaderOffset(): number {
  if (typeof window === "undefined") return 0;
  if (typeof document === "undefined") return 0;

  const rawValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--header-h")
    .trim();

  if (!rawValue) {
    return 0;
  }

  const parsed = Number.parseFloat(rawValue.replace("px", "").trim());

  return Number.isFinite(parsed) ? parsed : 0;
}

export function scrollToElement(
  element: HTMLElement,
  options?: ScrollToElementOptions,
): void {
  if (typeof window === "undefined") return;
  if (typeof document === "undefined") return;

  const behavior = options?.behavior ?? getScrollBehavior();
  const offset = options?.offset ?? getHeaderOffset();
  const block = options?.block ?? "start";
  const root = getScrollRoot();

  const elementRect = element.getBoundingClientRect();

  if (isWindowScrollRoot(root)) {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;

    let nextTop = elementRect.top + scrollTop;

    if (block === "center") {
      nextTop = nextTop - window.innerHeight / 2 + elementRect.height / 2;
    }

    nextTop = Math.max(0, nextTop - offset);

    window.scrollTo({
      top: nextTop,
      left: 0,
      behavior,
    });

    return;
  }

  const rootRect = root.getBoundingClientRect();
  const currentScrollTop = root.scrollTop;

  let nextTop = elementRect.top - rootRect.top + currentScrollTop;

  if (block === "center") {
    nextTop = nextTop - root.clientHeight / 2 + elementRect.height / 2;
  }

  nextTop = Math.max(0, nextTop - offset);

  root.scrollTo({
    top: nextTop,
    left: 0,
    behavior,
  });
}
