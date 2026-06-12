/**
 * @file packages/ui/src/renderer/cells/HeadingCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’un heading avec gestion du niveau,
 * de l’alignement, de la variante hero, du séparateur décoratif,
 * de l’ancre, du reveal et des segments mis en avant.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée (schema).
 * - `level` pilote la balise HTML finale (`h1` à `h6`).
 * - `variant="hero"` permet d’appliquer un style plus fort via le skin.
 * - `separator` affiche un séparateur décoratif entre le titre et le sous-titre.
 * - `idAnchor` pose un `id` HTML sur le heading.
 * - `reveal` active/désactive l’enrobage `SiteReveal`.
 * - `highlights` met en avant certains segments exacts du titre.
 */

import type { ReactNode } from "react";

import { Separator } from "@compoz/ui/components/ui/separator";
import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import type {
  SiteHeadingUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";
import type { HeadingCellShape } from "@compoz/validation/pages/blocks/cells/cell";

export type HeadingCellRendererProps = Readonly<{
  cell?: HeadingCellShape | null;
  ui: SiteHeadingUi;
  revealUi: SiteRevealPresetUi;
}>;

export function HeadingCellRenderer({
  cell,
  ui,
  revealUi,
}: HeadingCellRendererProps) {
  if (!cell) return null;

  const title = normalizeString(cell.title, "");
  if (!title) return null;

  const subtitle = normalizeString(cell.subtitle ?? "", "");
  const level = cell.level;
  const align = cell.align;
  const variant = cell.variant;
  const idAnchor = normalizeString(cell.idAnchor ?? "", "");
  const reveal = cell.reveal;
  const showSeparator = cell.separator === true && Boolean(subtitle);
  const highlights = normalizeHighlights(cell.highlights);

  const titleContent = renderHighlightedTitle(title, highlights, ui.highlight);

  const content = (
    <div
      className={cn(
        ui.container,
        align === "center"
          ? "items-center text-center"
          : "items-start text-left",
        variant === "hero" && ui.containerHero,
      )}
      data-cell="heading"
      data-level={level}
      data-align={align}
      data-variant={variant}
      data-separator={showSeparator ? "true" : "false"}
      data-reveal={reveal ? "true" : "false"}
    >
      <HeadingTag
        id={idAnchor || undefined}
        level={level}
        className={cn(
          "[font-family:var(--tenant-font-heading)]",
          ui.level[level],
          variant === "hero" && ui.levelHero,
        )}
      >
        {titleContent}
      </HeadingTag>

      {showSeparator ? (
        <Separator
          className={cn(ui.separator, variant === "hero" && ui.separatorHero)}
        />
      ) : null}

      {subtitle ? (
        <p className={cn(ui.subtitle, variant === "hero" && ui.subtitleHero)}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );

  return reveal ? (
    <SiteReveal revealUi={revealUi}>{content}</SiteReveal>
  ) : (
    content
  );
}

HeadingCellRenderer.displayName = "HeadingCellRenderer";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

type HeadingTagProps = Readonly<{
  id?: string;
  level: HeadingCellShape["level"];
  className?: string;
  children: ReactNode;
}>;

function HeadingTag({ id, level, className, children }: HeadingTagProps) {
  switch (level) {
    case "h1":
      return (
        <h1 id={id} className={className}>
          {children}
        </h1>
      );

    case "h2":
      return (
        <h2 id={id} className={className}>
          {children}
        </h2>
      );

    case "h3":
      return (
        <h3 id={id} className={className}>
          {children}
        </h3>
      );

    case "h4":
      return (
        <h4 id={id} className={className}>
          {children}
        </h4>
      );

    case "h5":
      return (
        <h5 id={id} className={className}>
          {children}
        </h5>
      );

    case "h6":
      return (
        <h6 id={id} className={className}>
          {children}
        </h6>
      );
  }
}

function normalizeHighlights(highlights: readonly string[] | null): string[] {
  if (!highlights?.length) return [];

  return highlights
    .map((item) => normalizeString(item, "").trim())
    .filter(Boolean);
}

function renderHighlightedTitle(
  title: string,
  highlights: readonly string[],
  highlightClassName?: string,
): ReactNode {
  if (!highlights.length) return title;

  const ranges = collectHighlightRanges(title, highlights);
  if (!ranges.length) return title;

  const parts: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    if (cursor < range.start) {
      parts.push(title.slice(cursor, range.start));
    }

    parts.push(
      <span
        key={`${range.start}-${range.end}-${index}`}
        className={highlightClassName}
      >
        {title.slice(range.start, range.end)}
      </span>,
    );

    cursor = range.end;
  });

  if (cursor < title.length) {
    parts.push(title.slice(cursor));
  }

  return parts;
}

type HighlightRange = Readonly<{
  start: number;
  end: number;
}>;

function collectHighlightRanges(
  title: string,
  highlights: readonly string[],
): HighlightRange[] {
  const lowerTitle = title.toLocaleLowerCase();

  const rawRanges: HighlightRange[] = [];

  highlights.forEach((highlight) => {
    const needle = highlight.toLocaleLowerCase();
    if (!needle) return;

    let fromIndex = 0;

    while (fromIndex < lowerTitle.length) {
      const matchIndex = lowerTitle.indexOf(needle, fromIndex);
      if (matchIndex === -1) break;

      rawRanges.push({
        start: matchIndex,
        end: matchIndex + needle.length,
      });

      fromIndex = matchIndex + needle.length;
    }
  });

  if (!rawRanges.length) return [];

  rawRanges.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - a.end;
  });

  const merged: HighlightRange[] = [];

  for (const range of rawRanges) {
    const previous = merged[merged.length - 1];

    if (!previous) {
      merged.push(range);
      continue;
    }

    if (range.start < previous.end) {
      continue;
    }

    merged.push(range);
  }

  return merged;
}
