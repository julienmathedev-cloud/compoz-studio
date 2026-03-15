"use client";

/**
 * @file packages/ui/src/site/components/organisms/SiteTimeline.tsx
 * @layer ui/site/organisms
 *
 * @description
 * Timeline publique utilisée pour afficher une suite d’étapes chronologiques.
 *
 * @remarks
 * - UI-only.
 * - Tous les styles sont pilotés par `ui`.
 * - Réutilise `SiteTimelineItem` pour le rendu d’un item individuel.
 * - Gère localement l’ouverture / fermeture de la timeline.
 */

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { SiteTimelineItem } from "@compoz/ui/site/components/molecules/SiteTimelineItem";
import type { SiteTimelineUi } from "@compoz/ui/site/site-ui.types";
import type { TimelineItemShape } from "@compoz/validation/pages/blocks/cells/cell";

export type SiteTimelineProps = Readonly<{
  items: readonly TimelineItemShape[];
  ui: SiteTimelineUi;
}>;

export function SiteTimeline({ items, ui }: SiteTimelineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  if (!items.length) return null;

  const handleScrollToButton = () => {
    anchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleClickButton = () => {
    if (!isOpen) {
      setIsOpen(true);

      window.setTimeout(() => {
        handleScrollToButton();
      }, 100);

      return;
    }

    setIsOpen(false);
  };

  return (
    <div className={cn(ui.root)}>
      <div className={cn(ui.triggerWrap)}>
        <Button
          type="button"
          size="icon"
          onClick={handleClickButton}
          aria-label={isOpen ? "Masquer la timeline" : "Afficher la timeline"}
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
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
          paddingTop: isOpen ? "1.5rem" : "0rem",
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className={cn(ui.collapse)}
      >
        {isOpen ? (
          <div className="relative">
            {/* Ligne verticale desktop + pastilles */}
            <div className={cn(ui.desktopRailWrap)}>
              <div className={cn(ui.desktopStartDot)} />

              <motion.div
                className={cn(ui.desktopLine)}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />

              <motion.div
                className={cn(ui.desktopEndDot)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.1, ease: "easeOut" }}
              />
            </div>

            <div className={cn(ui.contentWrap)}>
              {/* Ligne verticale mobile + pastilles */}
              <div className={cn(ui.mobileRailWrap)}>
                <div className={cn(ui.mobileStartDot)} />

                <motion.div
                  className={cn(ui.mobileLine)}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />

                <div className={cn(ui.mobileEndDot)} />
              </div>

              <div className={cn(ui.itemsWrap)}>
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.15,
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                  >
                    <SiteTimelineItem item={item} index={index} ui={ui.item} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

SiteTimeline.displayName = "SiteTimeline";
