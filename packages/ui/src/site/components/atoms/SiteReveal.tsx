"use client";

/**
 * @file packages/ui/src/site/components/atoms/SiteReveal.tsx
 * @layer ui/site/components
 *
 * @description
 * Apparition au scroll (fade + slide + scale) via Framer Motion.
 *
 * @remarks
 * - PRM : si prefers-reduced-motion => pas de mouvement (opacity=1, y=0, scale=1).
 * - once:true => l’animation ne se joue qu’une fois.
 * - Perf : will-change activé uniquement pendant l’animation.
 */

import type { UseInViewOptions } from "framer-motion";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

import { cn } from "@compoz/ui/lib/utils";

export type SiteRevealProps = Readonly<{
  as?:
    | "div"
    | "section"
    | "article"
    | "header"
    | "main"
    | "footer"
    | "aside"
    | "nav"
    | "ul"
    | "ol"
    | "li"
    | "p"
    | "span";

  className?: string;
  children: ReactNode;

  /** Delay explicite (ms). */
  delayMs?: number;

  /** Base pour calculer un delay (seedOrder * staggerMs) si delayMs absent. */
  seedOrder?: number;

  /** Pas (ms) utilisé avec seedOrder. */
  staggerMs?: number;

  /** Part visible pour considérer "in view" (0..1). */
  amount?: number;

  /** Margin viewport pour déclencher plus tôt/tard. */
  viewportMargin?: string;

  /** Offset Y initial (px) si motion autorisé. */
  initialY?: number;

  /** Scale initial si motion autorisé. */
  initialScale?: number;
}>;

type MotionElementTag = NonNullable<SiteRevealProps["as"]>;

const MOTION_COMPONENTS: Record<MotionElementTag, ElementType> = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  main: motion.main,
  footer: motion.footer,
  aside: motion.aside,
  nav: motion.nav,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  p: motion.p,
  span: motion.span,
};

export function SiteReveal({
  as = "div",
  className,
  children,
  delayMs,
  seedOrder = 1,
  staggerMs = 80,
  amount = 0.35,
  viewportMargin = "0px",
  initialY = 12,
  initialScale = 0.9,
}: SiteRevealProps) {
  const prefersReduced = useReducedMotion();

  const Comp = (MOTION_COMPONENTS[as] ?? motion.div) as ElementType;

  const ref = useRef<HTMLElement | null>(null);

  const inView = useInView(ref, {
    amount,
    margin: viewportMargin as UseInViewOptions["margin"],
    once: true,
  });

  // will-change uniquement pendant l’animation
  const [willChangeOn, setWillChangeOn] = useState(false);

  const delaySec = useMemo(() => {
    const computed = delayMs ?? seedOrder * staggerMs;
    return Math.max(0, computed) / 1000;
  }, [delayMs, seedOrder, staggerMs]);

  const variants = useMemo(() => {
    const hidden = prefersReduced
      ? { opacity: 1, y: 0, scale: 1 }
      : { opacity: 0, y: initialY, scale: initialScale };

    const visible = { opacity: 1, y: 0, scale: 1 };

    return { hidden, visible };
  }, [prefersReduced, initialY, initialScale]);

  return (
    <Comp
      ref={ref}
      className={cn(
        // PRM : will-change utile seulement si motion autorisé
        willChangeOn && !prefersReduced ? "will-change-transform" : null,
        className,
      )}
      // Important : pas besoin de bricoler le style à la main.
      initial={false}
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      transition={
        prefersReduced
          ? { duration: 0 } // neutralise
          : { duration: 0.3, ease: "easeOut", delay: delaySec }
      }
      onAnimationStart={() => {
        if (!prefersReduced) setWillChangeOn(true);
      }}
      onAnimationComplete={() => {
        setWillChangeOn(false);
      }}
    >
      {children}
    </Comp>
  );
}

SiteReveal.displayName = "SiteReveal";
