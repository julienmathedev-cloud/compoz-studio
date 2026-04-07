/**
 * @file packages/ui/src/renderer/cells/StructuredCardCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’une grille de structured cards.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée (schema).
 * - Ignore la cellule si aucun item exploitable n’est présent.
 * - La cellule porte le layout (`columns`), les items portent le contenu.
 * - Utilise `SiteStructuredCard` pour le rendu visuel.
 *   en attendant son renommage éventuel.
 */

import type { StructuredCardCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteStructuredCard } from "@compoz/ui/site/components/molecules/SiteStructuredCard";
import type { SiteStructuredCardUi } from "@compoz/ui/site/site-ui.types";

export type StructuredCardCellRendererProps = Readonly<{
  cell?: StructuredCardCellShape | null;
  ui: SiteStructuredCardUi;
}>;

export function StructuredCardCellRenderer({
  cell,
  ui,
}: StructuredCardCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = cell.items.filter((item) => {
    const title = normalizeString(item.title, "");
    const sections = Array.isArray(item.sections)
      ? item.sections.filter((section) => {
          const label = normalizeString(section.label, "");
          const content = normalizeString(section.content, "");
          return Boolean(label && content);
        })
      : [];

    return Boolean(title && sections.length > 0);
  });

  if (items.length < 1) return null;

  const columns = cell.columns ?? 1;

  return (
    <div className={ui.root} data-cell="structuredCard">
      <div className={cn(ui.grid, ui.columns[columns])}>
        {items.map((item) => {
          const title = normalizeString(item.title, "");
          const meta = normalizeString(item.meta ?? "", "") || undefined;

          const sections = (item.sections ?? [])
            .map((section) => ({
              label: normalizeString(section.label, ""),
              content: normalizeString(section.content, ""),
            }))
            .filter((section) => Boolean(section.label && section.content));

          const image =
            item.image?.src &&
            item.image.width &&
            item.image.height &&
            normalizeString(item.image.src, "")
              ? {
                  src: normalizeString(item.image.src, ""),
                  alt: normalizeString(item.image.alt, ""),
                  width: item.image.width,
                  height: item.image.height,
                  caption: normalizeString(
                    typeof item.image.caption === "string"
                      ? item.image.caption
                      : "",
                    "",
                  ),
                }
              : undefined;

          const button =
            item.button && normalizeString(item.button.label, "")
              ? {
                  label: normalizeString(item.button.label, ""),
                  href: normalizeString(item.button.href, ""),
                  variant: item.button.variant,
                }
              : undefined;

          return (
            <SiteStructuredCard
              key={item.id}
              title={title}
              meta={meta}
              sections={sections}
              image={image}
              button={button}
              ui={ui}
            />
          );
        })}
      </div>
    </div>
  );
}

StructuredCardCellRenderer.displayName = "StructuredCardCellRenderer";
