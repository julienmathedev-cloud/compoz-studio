"use client";

/**
 * @file packages/ui/src/site/components/molecules/SiteLightbox.tsx
 * @layer ui/site/components
 *
 * @description
 * SiteLightbox : lightbox plein écran pour zoomer une image (site + preview).
 *
 * @remarks
 * - UI-only : pas de logique métier.
 * - A11y : role="dialog", aria-modal="true", fermeture Esc, overlay click.
 * - UX : lock scroll (html overflow).
 * - Animations : classes (enter/from/active/exit) + motion-reduce.
 * - Focus : trap clavier (Tab/Shift+Tab) + restore focus au close.
 * - Skinnable : toutes les classes viennent du contrat `ui`.
 */

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { SiteAppImage } from "@compoz/ui/site/components/atoms/SiteAppImage";
import type { SiteLightboxUi } from "@compoz/ui/site/site-ui.types";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SiteLightboxImage = Readonly<{
  src: string;
  alt: string;
}>;

export type SiteLightboxProps = Readonly<{
  ui: SiteLightboxUi;
  image: SiteLightboxImage;
  onClose: () => void;
  caption?: string | null;
  ariaLabel?: string;
}>;

function readPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  return Boolean(mq?.matches);
}

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  const nodes = container.querySelectorAll<HTMLElement>(
    [
      "a[href]",
      "button",
      "input",
      "select",
      "textarea",
      '[tabindex]:not([tabindex="-1"])',
    ].join(","),
  );

  return Array.from(nodes).filter((el) => {
    if (el.hasAttribute("disabled")) {
      return false;
    }

    if (el.getAttribute("aria-disabled") === "true") {
      return false;
    }

    if (el.getAttribute("tabindex") === "-1") {
      return false;
    }

    return true;
  });
}

export function SiteLightbox({
  ui,
  image,
  onClose,
  caption,
  ariaLabel = "Agrandissement de l’image",
}: SiteLightboxProps) {
  const [prefersReducedMotion] = useState(() => readPrefersReducedMotion());
  const [entered, setEntered] = useState(() => prefersReducedMotion);
  const [closing, setClosing] = useState(false);

  const isClosingRef = useRef(false);
  const didCloseRef = useRef(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const finalizeClose = useCallback(() => {
    if (didCloseRef.current) {
      return;
    }

    didCloseRef.current = true;
    onClose();
  }, [onClose]);

  const beginClose = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;

    if (prefersReducedMotion) {
      finalizeClose();
      return;
    }

    setClosing(true);
  }, [finalizeClose, prefersReducedMotion]);

  useEffect(() => {
    restoreFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        beginClose();
        return;
      }

      if (e.key !== "Tab") {
        return;
      }

      const focusables = getFocusable(panelRef.current);

      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!active || !panelRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }

        return;
      }

      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);

    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;

      const el = restoreFocusRef.current;

      if (el && typeof el.focus === "function") {
        requestAnimationFrame(() => {
          try {
            el.focus({ preventScroll: true });
          } catch {
            el.focus();
          }
        });
      }
    };
  }, [beginClose]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setEntered(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  const src = String(image?.src ?? "").trim();
  const alt = String(image?.alt ?? "");

  if (!src) {
    return null;
  }

  const computedCaption = caption ?? alt;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className={cn(ui.overlay)}
      onClick={beginClose}
    >
      <div
        ref={panelRef}
        className={cn(
          ui.panel,
          prefersReducedMotion
            ? undefined
            : closing
              ? ui.panelExit
              : entered
                ? ui.panelEnter
                : ui.panelFrom,
        )}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={(e) => {
          if (!closing) {
            return;
          }

          if (e.currentTarget !== e.target) {
            return;
          }

          finalizeClose();
        }}
        onTransitionEnd={(e) => {
          if (!closing) {
            return;
          }

          if (e.currentTarget !== e.target) {
            return;
          }

          finalizeClose();
        }}
      >
        <Button
          variant="ghostVanilla"
          size="icon"
          aria-label="Fermer"
          onClick={beginClose}
          className={cn(ui.closeButton)}
          autoFocus
        >
          <X className={cn(ui.closeIcon)} aria-hidden />
        </Button>

        <div className={cn(ui.imageWrap)}>
          <SiteAppImage
            image={{ src, alt }}
            fill
            className={cn(ui.image)}
            priority={false}
            fetchPriority="auto"
            sizes="(max-width: 768px) 100vw, 90vw"
          />
        </div>

        {computedCaption ? (
          <div className={cn(ui.caption)}>{computedCaption}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

SiteLightbox.displayName = "SiteLightbox";
