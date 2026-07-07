"use client";

/**
 * @file packages/ui/src/site/components/atoms/SiteHeaderHeightSync.tsx
 * @layer ui/site/components/atoms
 *
 * @description
 * Synchronizes the measured public header height into the `--header-h` CSS variable.
 */

import { useEffect } from "react";

export function SiteHeaderHeightSync() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");

    if (!header) {
      return;
    }

    const sync = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--header-h", `${height}px`);
    };

    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(header);

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

SiteHeaderHeightSync.displayName = "SiteHeaderHeightSync";
