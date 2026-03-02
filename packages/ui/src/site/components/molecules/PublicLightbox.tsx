"use client";

/**
 * @file packages/ui/src/site/components/molecules/PublicLightbox.tsx
 * @layer ui/public/molecules
 *
 * @description
 * PublicLightbox : lightbox plein écran pour zoomer une image (public + preview).
 *
 * @remarks
 * - UI-only : pas de logique métier.
 * - A11y : role="dialog", aria-modal="true", fermeture Esc, overlay click.
 * - UX : lock scroll (html overflow).
 * - Animations : classes (enter/from/active/exit) + motion-reduce.
 * - Focus : trap clavier (Tab/Shift+Tab) + restore focus au close.
 * - Skinnable : toutes les classes viennent du contrat `ui`.
 */

import { cn } from "@compoz/ui/lib/utils";
import { PublicAppImage } from "@compoz/ui/site/components/atoms/PublicAppImage";
import type { PublicLightboxUi } from "@compoz/ui/site/public-ui.types";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type PublicLightboxImage = Readonly<{
  src: string;
  alt: string;
}>;

export type PublicLightboxProps = Readonly<{
  ui: PublicLightboxUi;

  image: PublicLightboxImage;
  /** IMPORTANT: le parent doit conditionnellement monter le composant */
  onClose: () => void;

  caption?: string | null;
  ariaLabel?: string;
}>;

/**
 * Lecture PRM (prefers-reduced-motion).
 * - SSR-safe : retourne false côté serveur.
 * - Client : matchMedia.
 */
function readPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  return Boolean(mq?.matches);
}

/**
 * Retourne la liste des éléments focusables d’un container.
 * Note : on filtre aussi les éléments désactivés.
 */
function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
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
    if (el.hasAttribute("disabled")) return false;
    if (el.getAttribute("aria-disabled") === "true") return false;
    // cacher / non interactif
    if (el.getAttribute("tabindex") === "-1") return false;
    return true;
  });
}

export function PublicLightbox({
  ui,
  image,
  onClose,
  caption,
  ariaLabel = "Agrandissement de l’image",
}: PublicLightboxProps) {
  // ✅ valeur figée au mount (V0.5) : simple et suffisante pour un lightbox
  const [prefersReducedMotion] = useState(() => readPrefersReducedMotion());

  // ✅ PRM : on considère l'overlay comme “entré” immédiatement
  const [entered, setEntered] = useState(() =>
    prefersReducedMotion ? true : false,
  );
  const [closing, setClosing] = useState(false);

  const isClosingRef = useRef(false);
  const didCloseRef = useRef(false);

  // Focus management
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const finalizeClose = useCallback(() => {
    if (didCloseRef.current) return;
    didCloseRef.current = true;
    onClose();
  }, [onClose]);

  const beginClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    // ✅ PRM : fermeture immédiate, sans attendre fin d'animation/transition
    if (prefersReducedMotion) {
      finalizeClose();
      return;
    }

    setClosing(true);
  }, [finalizeClose, prefersReducedMotion]);

  // lock scroll + ESC + focus trap
  useEffect(() => {
    // capture le focus courant (souvent le bouton qui a ouvert la lightbox)
    restoreFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        beginClose();
        return;
      }

      if (e.key !== "Tab") return;

      // Focus trap : Tab/Shift+Tab doivent rester dans le panel
      const focusables = getFocusable(panelRef.current);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Si focus hors panel, on le ramène dedans.
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

      // Tab normal
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

      // restore focus (si possible) quand le composant se démonte
      const el = restoreFocusRef.current;
      if (el && typeof el.focus === "function") {
        // rAF pour laisser React retirer le portal proprement
        requestAnimationFrame(() => el.focus());
      }
    };
  }, [beginClose]);

  // ✅ trigger enter on mount (next frame) uniquement en motion-safe
  useEffect(() => {
    if (prefersReducedMotion) return;

    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, [prefersReducedMotion]);

  const src = String(image?.src ?? "").trim();
  const alt = String(image?.alt ?? "");
  if (!src) return null;

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
          if (!closing) return;
          if (e.currentTarget !== e.target) return;
          finalizeClose();
        }}
        onTransitionEnd={(e) => {
          if (!closing) return;
          if (e.currentTarget !== e.target) return;
          finalizeClose();
        }}
      >
        <button
          type="button"
          aria-label="Fermer"
          onClick={beginClose}
          className={cn(ui.closeButton)}
          autoFocus
        >
          <X className={cn(ui.closeIcon)} aria-hidden />
        </button>

        <div className={cn(ui.imageWrap)}>
          <PublicAppImage
            image={{ src, alt }}
            fill
            className={cn(ui.image)}
            priority={false}
            fetchPriority="high"
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
