/**
 * @file packages/ui/src/lib/scrollToElement.ts
 * @layer ui/lib/scroll
 *
 * @description
 * Helpers UI-only pour scroller vers un élément DOM en tenant compte
 * de la hauteur du header sticky exposée via la variable CSS `--header-h`.
 *
 * @remarks
 * - Source de vérité de l’offset : `--header-h` sur `document.documentElement`.
 * - Respecte `prefers-reduced-motion` via `getScrollBehavior()`.
 * - Évite `scrollIntoView()` car celui-ci ne permet pas de gérer proprement
 *   un offset de header sticky/global.
 * - Supporte à la fois :
 *   - les scrolls portés par `window`
 *   - les scrolls portés par un conteneur `[data-scroll-root]`
 */

import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";

/**
 * Modes de positionnement vertical supportés pour le scroll.
 */
export type ScrollToElementBlock = "start" | "center";

/**
 * Options de scroll vers un élément DOM.
 */
export type ScrollToElementOptions = Readonly<{
  /**
   * Comportement de scroll.
   *
   * @defaultValue valeur retournée par `getScrollBehavior()`
   */
  behavior?: ScrollBehavior;

  /**
   * Offset explicite à soustraire à la position cible.
   *
   * @remarks
   * - Si omis, on utilise la hauteur de header lue depuis `--header-h`.
   * - Permet de forcer un offset spécifique dans certains cas particuliers.
   */
  offset?: number;

  /**
   * Positionnement souhaité de l’élément dans le viewport.
   *
   * - `"start"` : aligne le haut de l’élément sous le header.
   * - `"center"` : centre visuellement l’élément dans le viewport, puis applique l’offset.
   *
   * @defaultValue "start"
   */
  block?: ScrollToElementBlock;
}>;

type ScrollRoot = Window | HTMLElement;

/**
 * Résout la racine de scroll principale de la page.
 *
 * @returns
 * - le conteneur `[data-scroll-root]` s’il existe ;
 * - sinon `window`.
 */
function getScrollRoot(): ScrollRoot {
  if (typeof document === "undefined") {
    return window;
  }

  const root = document.querySelector<HTMLElement>("[data-scroll-root]");
  return root ?? window;
}

/**
 * Indique si la racine de scroll est `window`.
 */
function isWindowScrollRoot(root: ScrollRoot): root is Window {
  return typeof Window !== "undefined" && root instanceof Window;
}

/**
 * Lit la hauteur du header sticky depuis la variable CSS `--header-h`.
 *
 * @returns Hauteur du header en pixels. Retourne `0` si la variable est absente
 * ou invalide.
 */
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

/**
 * Scrolle la page vers un élément DOM en tenant compte du header sticky.
 *
 * @param element Élément cible.
 * @param options Options de scroll.
 *
 * @remarks
 * - Utilise la racine de scroll résolue (`window` ou `[data-scroll-root]`).
 * - Clamp la cible à `0` pour éviter les positions négatives.
 */
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
