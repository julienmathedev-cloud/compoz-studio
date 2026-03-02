"use client";

/**
 * @file packages/ui/src/site/components/molecules/PublicNavDropdown.tsx
 * @layer ui/public/molecules
 *
 * @description
 * Molecule public : dropdown de navigation (trigger + panel en portal) pour le header.
 *
 * @remarks
 * - Trigger :
 *   - `<button>` si `href` est vide ou `"#"`.
 *   - `PublicNavLink` sinon (normalisation/sécurité du `href`).
 * - Panel : `role="menu"` + items `role="menuitem"`.
 * - Clavier : Enter/Espace/↓ ouvrent ; Esc ferme ; Tab/Shift+Tab gèrent le cycle.
 * - Desktop : hover ouvre/ferme.
 * - Tactile : 1er tap ouvre, double-tap navigue (anti navigation involontaire).
 * - Le panel est rendu via portal et positionné en `fixed` sous le trigger (via `getBoundingClientRect`).
 */

import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

import { getAriaLabel } from "@compoz/ui/lib/a11y/helpers";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import {
  isActiveLink,
  resolveInternalHref,
  resolveLinkFlags,
} from "@compoz/ui/lib/links/helpers";
import { normalizeArray, normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { PublicNavLink } from "@compoz/ui/site/components/atoms/PublicNavLink";
import type {
  Dispatch,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  PointerEvent,
  ReactNode,
  Ref,
  RefObject,
  SetStateAction,
} from "react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type PublicNavItem = Readonly<{
  href: string;
  label: string;
  ariaLabel?: string;

  /**
   * Ouverture dans un nouvel onglet.
   * - Si absent : dérivé au rendu (externe => true, interne => false).
   */
  newTab?: boolean;
}>;

export type PublicNavDropdownUi = Readonly<{
  /** Classes appliquées par le skin/template (trigger). */
  itemContainer: string;

  /** Classes appliquées par le skin/template (lien). */
  itemLink: string;

  /** Classes appliquées par le skin/template (panel). */
  panel: string;
}>;

export type PublicNavDropdownProps = Readonly<{
  /** Href du trigger (défaut : "#"). "#"/vide → trigger button. */
  href?: string;
  /** Libellé visible si `children` est absent. */
  label?: string;
  /** Nom accessible optionnel du trigger (utile si icône seule). */
  ariaLabel?: string;
  /** Classes appliquées par le skin/template (wrapper). */
  className?: string;
  blurClassName?: string;
  /** Contenu du trigger (prioritaire sur `label`). */
  children?: ReactNode;
  /** Items du dropdown (filtrés côté UI si href/label vides). */
  items: ReadonlyArray<PublicNavItem>;
  /** Optionnel : classes UI injectées par le skin/template. */
  ui: PublicNavDropdownUi;
}>;

export function PublicNavDropdown({
  href = "#",
  ariaLabel,
  className,
  blurClassName,
  label,
  children,
  items,
  ui,
}: PublicNavDropdownProps) {
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const triggerId = useId();
  const panelId = useId();

  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
  }, [open]);

  // Détection tactile (pointer: coarse).
  const isCoarseRef = useRef(false);
  const lastTapTsRef = useRef(0);
  const suppressNextClickRef = useRef(false);
  const DOUBLE_TAP_MS = 450;

  useEffect(() => {
    const mm = window.matchMedia?.("(pointer: coarse)");
    isCoarseRef.current = mm ? mm.matches : (navigator.maxTouchPoints ?? 0) > 0;
  }, []);

  const pathname = usePathname() || "/";

  const normalizedHref = normalizeString(href);
  const triggerHref = normalizedHref
    ? resolveInternalHref(pathname, normalizedHref)
    : "";

  const links = normalizeArray<PublicNavItem>(items);
  const safeItems = links.filter(
    (it) => normalizeString(it.href) && normalizeString(it.label),
  );

  const hasSubItems = safeItems.length > 0;

  // ✅ IMPORTANT :
  // Si on a des sous-items, on FORCE un <button> pour le trigger.
  // => le dropdown reste ouvrable au survol/clavier, tout en gardant les items neutralisés via PublicNavLink.
  const isButtonTrigger =
    !normalizedHref || normalizedHref === "#" || hasSubItems;

  const triggerText = children ?? label ?? normalizedHref;

  // A11y : calcule un nom accessible pour le trigger button (icône seule / texte vide).
  const computedTriggerAria = getAriaLabel(ariaLabel, triggerText, "Menu");

  /**
   * ✅ newTab dérivé au rendu (pas stocké via `isExternal`).
   * - si `newTab` est fourni : respect strict
   * - sinon : externe => true, interne => false
   */
  const resolveNewTab = (href: string, newTab?: boolean) => {
    if (typeof newTab === "boolean") return newTab;
    const flags = resolveLinkFlags(normalizeString(href));
    return Boolean(flags.rawExternal);
  };

  const focusFirstItem = () => {
    const el = panelRef.current?.querySelector<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])',
    );
    el?.focus();
  };

  const refocusTrigger = () => {
    triggerRef.current?.focus();
  };

  function focusNextTopLevelAfterThisDropdown() {
    const li = containerRef.current?.closest("li");
    if (!li) return;

    let next: HTMLElement | null = li.nextElementSibling as HTMLElement | null;
    while (next) {
      const nextFocusable = next.querySelector<HTMLElement>(
        'a,button,[tabindex]:not([tabindex="-1"])',
      );
      if (nextFocusable) {
        nextFocusable.focus();
        return;
      }
      next = next.nextElementSibling as HTMLElement | null;
    }
    triggerRef.current?.focus();
  }

  const isInDropdown = (node: EventTarget | null) => {
    const n = node as Node | null;
    return (
      !!n && (triggerRef.current?.contains(n) || panelRef.current?.contains(n))
    );
  };

  const handleTriggerFocus = () => setOpen(true);
  const handleTriggerBlur = (e: FocusEvent) => {
    if (!isInDropdown(e.relatedTarget)) setOpen(false);
  };

  const handlePanelBlur = (e: FocusEvent) => {
    if (!isInDropdown(e.relatedTarget)) setOpen(false);
  };

  const handleItemClick = useCallback(() => {
    setTimeout(() => setOpen(false), 0);
  }, []);

  const isCurrentTrigger =
    !!normalizedHref &&
    isActiveLink(
      pathname,
      resolveInternalHref(pathname, normalizedHref),
      "exact",
    );

  const childActive = safeItems.some((i) => {
    const h = normalizeString(i.href);
    if (!h) return false;
    const resolved = resolveInternalHref(pathname, h);
    return isActiveLink(pathname, resolved, "startsWith");
  });

  const sectionActive = isCurrentTrigger || childActive;

  const setTriggerEl = (el: HTMLButtonElement | HTMLAnchorElement | null) => {
    triggerRef.current = el;
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative")}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {isButtonTrigger ? (
        <button
          ref={setTriggerEl}
          id={triggerId}
          type="button"
          aria-label={computedTriggerAria}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={panelId}
          onFocus={handleTriggerFocus}
          onBlur={handleTriggerBlur}
          onKeyDown={(e) =>
            handleTriggerKeyDown(e, open, setOpen, focusFirstItem)
          }
          className={cn(className, ui.itemContainer, ui.itemLink)}
          data-section-active={sectionActive || undefined}
        >
          {triggerText}
        </button>
      ) : (
        <PublicNavLink
          ref={setTriggerEl as unknown as Ref<HTMLAnchorElement>}
          id={triggerId}
          href={triggerHref || normalizedHref}
          ariaLabel={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={panelId}
          onFocus={handleTriggerFocus}
          onBlur={handleTriggerBlur}
          onKeyDown={(e) =>
            handleTriggerKeyDown(e, open, setOpen, focusFirstItem)
          }
          onClick={(e) =>
            handleDropdownTriggerClick(
              e,
              open,
              setOpen,
              focusFirstItem,
              suppressNextClickRef,
              isCoarseRef,
              lastTapTsRef,
              DOUBLE_TAP_MS,
            )
          }
          onPointerDown={(e) =>
            handleDropdownTriggerPointerDown(
              e,
              open,
              setOpen,
              focusFirstItem,
              suppressNextClickRef,
            )
          }
          className={cn(className, ui.itemContainer, ui.itemLink)}
          linkClassName={cn(ui.itemLink)}
          data-section-active={sectionActive || undefined}
        >
          {triggerText}
        </PublicNavLink>
      )}

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="menu"
            aria-labelledby={triggerId}
            aria-hidden={!open}
            data-state={open ? "open" : "closed"}
            onKeyDown={(e) =>
              handlePanelKeyDown(
                e,
                setOpen,
                refocusTrigger,
                focusNextTopLevelAfterThisDropdown,
                panelRef,
              )
            }
            onBlur={handlePanelBlur}
            style={{ position: "fixed", left: rect.left, top: rect.bottom }}
            className={cn(
              ui.panel,
              blurClassName,
              // ✅ PRM guard : si un skin met des animations/transitions, on les coupe en reduced-motion.
              "motion-reduce:transition-none motion-reduce:animate-none",
              open
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none",
            )}
          >
            <ul>
              {safeItems.map((item, index) => (
                <li
                  key={getDropdownItemKey(item, index)}
                  className={cn("list-none")}
                  role="none"
                >
                  <PublicNavLink
                    href={item.href}
                    label={item.label}
                    ariaLabel={item.ariaLabel}
                    newTab={resolveNewTab(item.href, item.newTab)}
                    role="menuitem"
                    className={cn(ui.itemContainer)}
                    linkClassName={cn(ui.itemLink)}
                    onClick={handleItemClick}
                  />
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}

/**
 * Construit une clé stable pour un item de dropdown.
 */
function getDropdownItemKey(item: PublicNavItem, index: number) {
  const href = normalizeString(item.href);
  const label = normalizeString(item.label);
  return toStableUiKey({ href, label }, index);
}

function handleTriggerKeyDown(
  e: KeyboardEvent,
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
  focusFirstItem: () => void,
) {
  if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
    e.preventDefault();
    setOpen(true);
    requestAnimationFrame(focusFirstItem);
    return;
  }
  if (e.key === "Tab" && !e.shiftKey) {
    if (!open) setOpen(true);
    e.preventDefault();
    requestAnimationFrame(focusFirstItem);
    return;
  }
  if (e.key === "Escape") setOpen(false);
}

function handleDropdownTriggerClick(
  e: MouseEvent<HTMLAnchorElement>,
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
  focusFirstItem: () => void,
  suppressNextClickRef: MutableRefObject<boolean>,
  isCoarseRef: MutableRefObject<boolean>,
  lastTapTsRef: MutableRefObject<number>,
  DOUBLE_TAP_MS: number,
) {
  if (isCoarseRef.current && suppressNextClickRef.current) {
    e.preventDefault();
    e.stopPropagation();
    suppressNextClickRef.current = false;
    return;
  }
  if (!isCoarseRef.current) return; // desktop : laisser naviguer

  const now = Date.now();
  const elapsed = now - (lastTapTsRef.current || 0);
  lastTapTsRef.current = now;

  if (!open) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    requestAnimationFrame(focusFirstItem);
    return;
  }

  if (elapsed <= DOUBLE_TAP_MS) {
    setOpen(false); // navigation : éviter flash
    return;
  }

  e.preventDefault();
  e.stopPropagation();
  setOpen(false);
}

function handleDropdownTriggerPointerDown(
  e: PointerEvent<HTMLAnchorElement>,
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
  focusFirstItem: () => void,
  suppressNextClickRef: MutableRefObject<boolean>,
) {
  if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
  if (!open) {
    e.preventDefault();
    e.stopPropagation();
    suppressNextClickRef.current = true;
    setOpen(true);
    requestAnimationFrame(focusFirstItem);
  }
}

function handlePanelKeyDown(
  e: KeyboardEvent,
  setOpen: Dispatch<SetStateAction<boolean>>,
  refocusTrigger: () => void,
  focusNextTopLevelAfterThisDropdown: () => void,
  panelRef: RefObject<HTMLDivElement | null>,
) {
  if (e.key === "Escape") {
    e.preventDefault();
    setOpen(false);
    requestAnimationFrame(refocusTrigger);
    return;
  }

  if (e.key === "Tab") {
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'a,button,[tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      setOpen(false);
      requestAnimationFrame(refocusTrigger);
      return;
    }

    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      setOpen(false);
      requestAnimationFrame(focusNextTopLevelAfterThisDropdown);
      return;
    }
  }
}

PublicNavDropdown.displayName = "PublicNavDropdown";
