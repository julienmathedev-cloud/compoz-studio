"use client";

/**
 * @file packages/ui/src/site/components/atoms/SiteReveal.tsx
 */

import type { UseInViewOptions } from "framer-motion";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { ElementType, ReactNode } from "react";
import { useMemo, useRef } from "react";

import { cn } from "@compoz/ui/lib/utils";
import type { SiteRevealPresetUi } from "@compoz/ui/site/site-ui.types";

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
  revealUi: SiteRevealPresetUi;
  delayMs?: number;
  seedOrder?: number;
  staggerMs?: number;
  amount?: number;
  viewportMargin?: string;
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
  revealUi,
  delayMs,
  seedOrder = 1,
  staggerMs = 80,
  amount = 0.35,
  viewportMargin = "0px",
}: SiteRevealProps) {
  const prefersReduced = useReducedMotion();

  const Comp = (MOTION_COMPONENTS[as] ?? motion.div) as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  const inView = useInView(ref, {
    amount,
    margin: viewportMargin as UseInViewOptions["margin"],
    once: true,
  });

  const delaySec = Math.max(0, delayMs ?? seedOrder * staggerMs) / 1000;

  const variants = useMemo(() => {
    if (prefersReduced) {
      return {
        hidden: { opacity: 1, y: 0, scale: 1 },
        visible: { opacity: 1, y: 0, scale: 1 },
      };
    }

    return {
      hidden: revealUi.hidden,
      visible: revealUi.visible,
    };
  }, [prefersReduced, revealUi]);

  const transition = useMemo(() => {
    if (prefersReduced) {
      return { duration: 0 };
    }

    return {
      ...revealUi.transition,
      delay: delaySec,
    };
  }, [prefersReduced, revealUi, delaySec]);

  return (
    <Comp
      ref={ref}
      className={cn(
        !prefersReduced && "will-change-transform",
        "relative h-full",
        className,
      )}
      initial={false}
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      transition={transition}
    >
      {children}
    </Comp>
  );
}

SiteReveal.displayName = "SiteReveal";
