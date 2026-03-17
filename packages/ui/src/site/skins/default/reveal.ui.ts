/**
 * @file packages/ui/src/site/skins/default/reveal.ui.ts
 * @layer ui/site/skins
 *
 * @description
 * Skin UI — reveal (thème Default).
 */

export const defaultRevealUi = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  "fade-up": {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  "scale-in": {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  "slide-up": {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut" },
  },
} as const;
