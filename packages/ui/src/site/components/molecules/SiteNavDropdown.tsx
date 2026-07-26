"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteNavDropdown.tsx
 * @layer ui/site/components/molecules
 *
 * @description
 * Renders a public site navigation disclosure with a button trigger and a
 * portal-mounted list of navigation links.
 *
 * @remarks
 * Handles active-section state, keyboard focus transitions, mouse hover,
 * touch focus behavior, themed portal placement, and fixed panel positioning
 * from the trigger rectangle.
 */

import { usePathname } from "next/navigation";
import type {
  Dispatch,
  FocusEvent,
  KeyboardEvent,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";
import {
  useCallback,
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

type DropdownPortalLayout = Readonly<{
  rect: DOMRect;
  container: HTMLElement;
}>;

export type SiteNavDropdownProps = Readonly<{
  /**
   * Optional section URL used to determine the active state of the trigger.
   * The trigger itself is always rendered as a button.
   */
  href?: string;

  label?: string;
  ariaLabel?: string;
  className?: string;
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
  label,
  children,
  items,
  itemContainerClass,
  itemLinkClass,
  itemLabelClass,
  panelClass,
}: SiteNavDropdownProps) {
  const [open, setOpen] = useState(false);
  const [portalLayout, setPortalLayout] = useState<DropdownPortalLayout | null>(
    null,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const panelId = useId();

  const pathname = usePathname() ?? "/";

  const normalizedHref = useMemo(() => normalizeString(href), [href]);

  const safeItems = useMemo(() => {
    return items.filter(
      (item) =>
        normalizeString(item.id) &&
        normalizeString(item.href) &&
        normalizeString(item.label),
    );
  }, [items]);

  const triggerText = children ?? label ?? normalizedHref;
  const computedTriggerAria = getAriaLabel(
    ariaLabel,
    triggerText,
    "Navigation",
  );

  const isCurrentTrigger =
    !!normalizedHref &&
    normalizedHref !== "#" &&
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

    const resolvedHref = resolveInternalHref(pathname, itemHref);

    return isActiveLink(pathname, resolvedHref, "startsWith");
  });

  const sectionActive = isCurrentTrigger || childActive;

  useLayoutEffect(() => {
    if (!open) {
      setPortalLayout(null);
      return;
    }

    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    setPortalLayout({
      rect: trigger.getBoundingClientRect(),
      container:
        trigger.closest<HTMLElement>("[data-site-theme-boundary]") ??
        document.body,
    });
  }, [open]);

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
    const listItem = containerRef.current?.closest("li");

    if (!listItem) {
      return;
    }

    let nextItem = listItem.nextElementSibling as HTMLElement | null;

    while (nextItem) {
      const nextFocusable = nextItem.querySelector<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])',
      );

      if (nextFocusable) {
        nextFocusable.focus();
        return;
      }

      nextItem = nextItem.nextElementSibling as HTMLElement | null;
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

  const handleTriggerFocus = () => {
    setOpen(true);
  };

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
      <button
        ref={triggerRef}
        type="button"
        aria-label={computedTriggerAria}
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
        <span className={cn(itemLabelClass)}>{triggerText}</span>
      </button>

      {open &&
        portalLayout &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            data-state="open"
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
            style={{
              position: "fixed",
              left: portalLayout.rect.left,
              top: portalLayout.rect.bottom,
            }}
            className={cn(
              panelClass,
              "pointer-events-auto opacity-100",
              "motion-reduce:animate-none motion-reduce:transition-none",
            )}
          >
            <ul>
              {safeItems.map((item) => (
                <li key={item.id} className="list-none">
                  <SiteNavLink
                    href={item.href}
                    label={item.label}
                    ariaLabel={item.ariaLabel}
                    newTab={resolveNewTab(item.href, item.newTab)}
                    className={cn(itemContainerClass)}
                    linkClassName={cn(itemLinkClass)}
                    labelClassName={cn(itemLabelClass)}
                    onClick={handleItemClick}
                  />
                </li>
              ))}
            </ul>
          </div>,
          portalLayout.container,
        )}
    </div>
  );
}

function handleTriggerKeyDown(
  event: KeyboardEvent,
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
  focusFirstItem: () => void,
) {
  if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
    event.preventDefault();
    setOpen(true);
    requestAnimationFrame(focusFirstItem);
    return;
  }

  /*
   * The dropdown panel is portalled outside the trigger's DOM subtree.
   * Explicit focus transfer restores the expected navigation order.
   */
  if (event.key === "Tab" && !event.shiftKey) {
    if (!open) {
      setOpen(true);
    }

    event.preventDefault();
    requestAnimationFrame(focusFirstItem);
    return;
  }

  if (event.key === "Escape") {
    setOpen(false);
  }
}

function handlePanelKeyDown(
  event: KeyboardEvent,
  setOpen: Dispatch<SetStateAction<boolean>>,
  refocusTrigger: () => void,
  focusNextTopLevelAfterThisDropdown: () => void,
  panelRef: RefObject<HTMLDivElement | null>,
) {
  if (event.key === "Escape") {
    event.preventDefault();
    setOpen(false);
    requestAnimationFrame(refocusTrigger);
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
    'a, button, [tabindex]:not([tabindex="-1"])',
  );

  if (!focusables || focusables.length === 0) {
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    setOpen(false);
    requestAnimationFrame(refocusTrigger);
    return;
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    setOpen(false);
    requestAnimationFrame(focusNextTopLevelAfterThisDropdown);
  }
}

SiteNavDropdown.displayName = "SiteNavDropdown";
