"use client";

/**
 * @file packages/ui/src/site/components/organisms/SiteTimeline.tsx
 * @layer ui/site/components/organisms
 *
 * @description
 * Renders a public site timeline with optional collapse behavior and measured desktop item offsets.
 *
 * @remarks
 * Keeps closing content mounted until the collapse animation finishes, and scrolls reopening with the sticky header offset handled by `scrollToElement`.
 */

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@compoz/ui/components/ui/button";
import { scrollToElement } from "@compoz/ui/lib/scrollToElement";
import { cn } from "@compoz/ui/lib/utils";
import { SiteTimelineItem } from "@compoz/ui/site/components/molecules/SiteTimelineItem";
import type { SiteTimelineUi } from "@compoz/ui/site/site-ui.types";
import type { TimelineItemShape } from "@compoz/validation/pages/blocks/cells/cell";

export type SiteTimelineProps = Readonly<{
  items: readonly TimelineItemShape[];
  collapsible: boolean;
  ui: SiteTimelineUi;
}>;

const OVERLAP_RATIO = 0.68;
const MAX_OVERLAP_PX = 600;
const COLLAPSE_DURATION_MS = 500;
const STATIC_TOP_PADDING_CLASS = "pt-8";

function useTimelineItemOffsets(
  items: readonly TimelineItemShape[],
  enabled: boolean,
) {
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const registerItemRef = useCallback(
    (index: number, node: HTMLDivElement | null) => {
      itemRefs.current[index] = node;
    },
    [],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const nodes = itemRefs.current.slice(0, items.length);

    const readHeights = () => {
      const nextHeights = nodes.map((node) =>
        node ? Math.round(node.getBoundingClientRect().height) : 0,
      );

      setItemHeights((prev) => {
        if (
          prev.length === nextHeights.length &&
          prev.every((value, index) => value === nextHeights[index])
        ) {
          return prev;
        }

        return nextHeights;
      });
    };

    readHeights();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      readHeights();
    });

    nodes.forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [enabled, items]);

  const itemOffsets = useMemo(() => {
    return items.map((_, index) => {
      if (index === 0) {
        return 0;
      }

      const previousHeight = itemHeights[index - 1];

      if (!previousHeight || previousHeight <= 0) {
        return 0;
      }

      const overlap = Math.min(
        MAX_OVERLAP_PX,
        Math.round(previousHeight * OVERLAP_RATIO),
      );

      return -overlap;
    });
  }, [itemHeights, items]);

  return {
    itemOffsets,
    registerItemRef,
  };
}

type TimelineContentProps = Readonly<{
  items: readonly TimelineItemShape[];
  ui: SiteTimelineUi;
  measureEnabled: boolean;
  animated: boolean;
  outerClassName?: string;
}>;

function TimelineContent({
  items,
  ui,
  measureEnabled,
  animated,
  outerClassName,
}: TimelineContentProps) {
  const { itemOffsets, registerItemRef } = useTimelineItemOffsets(
    items,
    measureEnabled,
  );

  return (
    <div className={cn("relative", outerClassName)}>
      <div className={cn(ui.desktopRailWrap)}>
        <div className={cn(ui.desktopStartDot)} />

        {animated ? (
          <motion.div
            className={cn(ui.desktopLine)}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ) : (
          <div className={cn(ui.desktopLine)} />
        )}

        {animated ? (
          <motion.div
            className={cn(ui.desktopEndDot)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.1, ease: "easeOut" }}
          />
        ) : (
          <div className={cn(ui.desktopEndDot)} />
        )}
      </div>

      <div className={cn(ui.contentWrap)}>
        <div className={cn(ui.mobileRailWrap)}>
          <div className={cn(ui.mobileStartDot)} />

          {animated ? (
            <motion.div
              className={cn(ui.mobileLine)}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          ) : (
            <div className={cn(ui.mobileLine)} />
          )}

          <div className={cn(ui.mobileEndDot)} />
        </div>

        <div className={cn(ui.itemsWrap)}>
          {items.map((item, index) => {
            const itemNode = (
              <SiteTimelineItem
                item={item}
                index={index}
                ui={ui.item}
                desktopOffset={itemOffsets[index] ?? 0}
              />
            );

            if (!animated) {
              return (
                <div
                  key={item.id}
                  ref={(node) => {
                    registerItemRef(index, node);
                  }}
                >
                  {itemNode}
                </div>
              );
            }

            return (
              <motion.div
                key={item.id}
                ref={(node) => {
                  registerItemRef(index, node);
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.15,
                  duration: 0.4,
                  ease: "easeOut",
                }}
              >
                {itemNode}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CollapsibleTimeline({
  items,
  ui,
}: Pick<SiteTimelineProps, "items" | "ui">) {
  const [isOpen, setIsOpen] = useState(false);

  /** Keep content mounted during close animations to avoid abrupt removal. */
  const [shouldRender, setShouldRender] = useState(false);

  const [canAnimate, setCanAnimate] = useState(false);

  const anchorRef = useRef<HTMLDivElement>(null);

  const scrollToAnchor = () => {
    if (!anchorRef.current) return;

    scrollToElement(anchorRef.current, {
      block: "start",
    });
  };

  const handleClickButton = () => {
    if (!isOpen) {
      setIsOpen(true);

      window.setTimeout(() => {
        scrollToAnchor();
      }, 100);

      return;
    }

    setIsOpen(false);
  };

  /** Delay unmounting to mirror the visual collapse duration. */
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);

      const raf = window.requestAnimationFrame(() => {
        setCanAnimate(true);
      });

      return () => {
        window.cancelAnimationFrame(raf);
      };
    }

    setCanAnimate(false);

    const timeout = window.setTimeout(() => {
      setShouldRender(false);
    }, COLLAPSE_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isOpen]);

  return (
    <div className={cn(ui.root)}>
      <div className={cn(ui.triggerWrap)}>
        <Button
          size="icon"
          onClick={handleClickButton}
          aria-label={isOpen ? "Masquer la timeline" : "Afficher la timeline"}
          aria-expanded={isOpen}
          className={cn(ui.triggerButton)}
        >
          <ChevronDown
            className={cn(
              ui.triggerIcon,
              isOpen ? ui.triggerIconClosed : ui.triggerIconOpen,
            )}
          />
          <ChevronUp
            className={cn(
              ui.triggerIcon,
              isOpen ? ui.triggerIconOpen : ui.triggerIconClosed,
            )}
          />
        </Button>
      </div>

      <div ref={anchorRef} />

      <motion.div
        layout
        initial={false}
        animate={{
          height: canAnimate ? "auto" : 0,
          opacity: canAnimate ? 1 : 0,
          paddingTop: canAnimate ? "2rem" : "0rem",
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className={cn(ui.collapse)}
      >
        {shouldRender ? (
          <TimelineContent
            items={items}
            ui={ui}
            measureEnabled={shouldRender}
            animated
          />
        ) : null}
      </motion.div>
    </div>
  );
}

function StaticTimeline({
  items,
  ui,
}: Pick<SiteTimelineProps, "items" | "ui">) {
  return (
    <div className={cn(ui.root)}>
      <div className={cn(STATIC_TOP_PADDING_CLASS)}>
        <TimelineContent
          items={items}
          ui={ui}
          measureEnabled={false}
          animated={false}
        />
      </div>
    </div>
  );
}

export function SiteTimeline({ items, collapsible, ui }: SiteTimelineProps) {
  if (!items.length) {
    return null;
  }

  return collapsible ? (
    <CollapsibleTimeline items={items} ui={ui} />
  ) : (
    <StaticTimeline items={items} ui={ui} />
  );
}

SiteTimeline.displayName = "SiteTimeline";
