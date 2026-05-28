"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteNavDropdown.tsx
 * @layer ui/site/components
 *
 * @description
 * Molecule site : dropdown de navigation (trigger + panel en portal) pour le header.
 *
 * @remarks
 * - Trigger :
 *   - `<button>` si `href` est vide ou `"#"`.
 *   - `SiteNavLink` sinon (normalisation/sécurité du `href`).
 * - Panel : `role="menu"` + items `role="menuitem"`.
 * - Clavier : Enter/Espace/↓ ouvrent ; Esc ferme ; Tab/Shift+Tab gèrent le cycle.
 * - Desktop : hover ouvre/ferme.
 * - Tactile : 1er tap ouvre, double-tap navigue (anti navigation involontaire).
 * - Le panel est rendu via portal et positionné en `fixed` sous le trigger (via `getBoundingClientRect`).
 */

import { usePathname } from "next/navigation";
import type {
  Dispatch,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  PointerEvent,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { getAriaLabel } from "@compoz/ui/lib/a11y/helpers";
import {
  isActiveLink,
  resolveInternalHref,
  resolveLinkFlags,
} from "@compoz/ui/lib/links/helpers";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteNavLink } from "@compoz/ui/site/components/atoms/SiteNavLink";

type SiteNavItem = Readonly<{
  id: string;
  href: string;
  label: string;
  ariaLabel?: string;
  newTab?: boolean;
}>;

export type SiteNavDropdownProps = Readonly<{
  href?: string;
  label?: string;
  ariaLabel?: string;
  className?: string;
  blurClassName?: string;
  children?: ReactNode;
  items: ReadonlyArray<SiteNavItem>;
  itemContainerClass?: string;
  itemLinkClass?: string;
  itemLabelClass?: string;
  panelClass?: string;
}>;

export function SiteNavDropdown({
  href = "#",
  ariaLabel,
  className,
  blurClassName,
  label,
  children,
  items,
  itemContainerClass,
  itemLinkClass,
  itemLabelClass,
  panelClass,
}: SiteNavDropdownProps) {
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

  const isCoarseRef = useRef(false);
  const lastTapTsRef = useRef(0);
  const suppressNextClickRef = useRef(false);
  const DOUBLE_TAP_MS = 450;

  useEffect(() => {
    const mm = window.matchMedia?.("(pointer: coarse)");
    isCoarseRef.current = mm ? mm.matches : (navigator.maxTouchPoints ?? 0) > 0;
  }, []);

  const pathname = usePathname() ?? "/";

  const normalizedHref = useMemo(() => normalizeString(href), [href]);

  const triggerHref = useMemo(() => {
    return normalizedHref ? resolveInternalHref(pathname, normalizedHref) : "";
  }, [normalizedHref, pathname]);

  const safeItems = useMemo(() => {
    return items.filter(
      (item) =>
        normalizeString(item.id) &&
        normalizeString(item.href) &&
        normalizeString(item.label),
    );
  }, [items]);

  const hasSubItems = safeItems.length > 0;

  const isButtonTrigger =
    !normalizedHref || normalizedHref === "#" || hasSubItems;

  const triggerText = children ?? label ?? normalizedHref;
  const computedTriggerAria = getAriaLabel(ariaLabel, triggerText, "Menu");

  const isCurrentTrigger =
    !!normalizedHref &&
    isActiveLink(
      pathname,
      resolveInternalHref(pathname, normalizedHref),
      "exact",
    );

  const childActive = safeItems.some((item) => {
    const itemHref = normalizeString(item.href);

    if (!itemHref) {
      return false;
    }

    const resolved = resolveInternalHref(pathname, itemHref);
    return isActiveLink(pathname, resolved, "startsWith");
  });

  const sectionActive = isCurrentTrigger || childActive;

  const focusFirstItem = () => {
    const element = panelRef.current?.querySelector<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])',
    );

    element?.focus();
  };

  const refocusTrigger = () => {
    triggerRef.current?.focus();
  };

  function focusNextTopLevelAfterThisDropdown() {
    const li = containerRef.current?.closest("li");

    if (!li) {
      return;
    }

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
    const currentNode = node as Node | null;

    return (
      !!currentNode &&
      (triggerRef.current?.contains(currentNode) ||
        panelRef.current?.contains(currentNode))
    );
  };

  const handleTriggerFocus = () => setOpen(true);

  const handleTriggerBlur = (event: FocusEvent) => {
    if (!isInDropdown(event.relatedTarget)) {
      setOpen(false);
    }
  };

  const handlePanelBlur = (event: FocusEvent) => {
    if (!isInDropdown(event.relatedTarget)) {
      setOpen(false);
    }
  };

  const handleItemClick = useCallback(() => {
    setTimeout(() => setOpen(false), 0);
  }, []);

  const setTriggerEl = (
    element: HTMLButtonElement | HTMLAnchorElement | null,
  ) => {
    triggerRef.current = element;
  };

  const resolveNewTab = (itemHref: string, newTab?: boolean) => {
    if (typeof newTab === "boolean") {
      return newTab;
    }

    const flags = resolveLinkFlags(normalizeString(itemHref));
    return Boolean(flags.rawExternal);
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
          onKeyDown={(event) =>
            handleTriggerKeyDown(event, open, setOpen, focusFirstItem)
          }
          className={cn(className, itemContainerClass, itemLinkClass)}
          data-section-active={sectionActive || undefined}
        >
          {triggerText}
        </button>
      ) : (
        <SiteNavLink
          ref={setTriggerEl}
          id={triggerId}
          href={triggerHref || normalizedHref}
          ariaLabel={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={panelId}
          onFocus={handleTriggerFocus}
          onBlur={handleTriggerBlur}
          onKeyDown={(event) =>
            handleTriggerKeyDown(event, open, setOpen, focusFirstItem)
          }
          onClick={(event) =>
            handleDropdownTriggerClick(
              event,
              open,
              setOpen,
              focusFirstItem,
              suppressNextClickRef,
              isCoarseRef,
              lastTapTsRef,
              DOUBLE_TAP_MS,
            )
          }
          onPointerDown={(event) =>
            handleDropdownTriggerPointerDown(
              event,
              open,
              setOpen,
              focusFirstItem,
              suppressNextClickRef,
            )
          }
          className={cn(className, itemContainerClass)}
          linkClassName={cn(itemLinkClass)}
          labelClassName={cn(itemLabelClass)}
          data-section-active={sectionActive || undefined}
        >
          {triggerText}
        </SiteNavLink>
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
            onKeyDown={(event) =>
              handlePanelKeyDown(
                event,
                setOpen,
                refocusTrigger,
                focusNextTopLevelAfterThisDropdown,
                panelRef,
              )
            }
            onBlur={handlePanelBlur}
            style={{ position: "fixed", left: rect.left, top: rect.bottom }}
            className={cn(
              panelClass,
              "motion-reduce:transition-none motion-reduce:animate-none",
              open
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none",
            )}
          >
            <ul>
              {safeItems.map((item) => (
                <li key={item.id} className={cn("list-none")} role="none">
                  <SiteNavLink
                    href={item.href}
                    label={item.label}
                    ariaLabel={item.ariaLabel}
                    newTab={resolveNewTab(item.href, item.newTab)}
                    role="menuitem"
                    className={cn(itemContainerClass)}
                    linkClassName={cn(itemLinkClass)}
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
    if (!open) {
      setOpen(true);
    }

    e.preventDefault();
    requestAnimationFrame(focusFirstItem);
    return;
  }

  if (e.key === "Escape") {
    setOpen(false);
  }
}

function handleDropdownTriggerClick(
  e: MouseEvent<HTMLAnchorElement>,
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
  focusFirstItem: () => void,
  suppressNextClickRef: MutableRefObject<boolean>,
  isCoarseRef: MutableRefObject<boolean>,
  lastTapTsRef: MutableRefObject<number>,
  doubleTapMs: number,
) {
  if (isCoarseRef.current && suppressNextClickRef.current) {
    e.preventDefault();
    e.stopPropagation();
    suppressNextClickRef.current = false;
    return;
  }

  if (!isCoarseRef.current) {
    return;
  }

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

  if (elapsed <= doubleTapMs) {
    setOpen(false);
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
  if (e.pointerType !== "touch" && e.pointerType !== "pen") {
    return;
  }

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

    if (!focusables || focusables.length === 0) {
      return;
    }

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
    }
  }
}

SiteNavDropdown.displayName = "SiteNavDropdown";
