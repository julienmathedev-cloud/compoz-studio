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
 * - `reveal` active/désactive l’enrobage `SiteReveal` item par item.
 */

import type { StructuredCardCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import { SiteStructuredCard } from "@compoz/ui/site/components/molecules/SiteStructuredCard";
import type {
  SiteRevealPresetUi,
  SiteStructuredCardUi,
} from "@compoz/ui/site/site-ui.types";

export type StructuredCardCellRendererProps = Readonly<{
  cell?: StructuredCardCellShape | null;
  ui: SiteStructuredCardUi;
  revealUi: SiteRevealPresetUi;
}>;

type StructuredCardColumns = 1 | 2 | 3;

export function StructuredCardCellRenderer({
  cell,
  ui,
  revealUi,
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

  const requestedColumns = clampColumns(cell.columns ?? 1);
  const reveal = cell.reveal === true;

  /**
   * On limite le layout au nombre réel d’items pour obtenir :
   * - 1 item  -> layout 1
   * - 2 items -> layout 2
   * - 3+      -> layout 3 (dans la limite du layout demandé)
   */
  const effectiveColumns = Math.min(
    requestedColumns,
    items.length,
  ) as StructuredCardColumns;

  return (
    <div
      className={ui.root}
      data-cell="structuredCard"
      data-reveal={reveal ? "true" : "false"}
    >
      <div className={cn(ui.grid, ui.columns[effectiveColumns])}>
        {items.map((item, index) => {
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

          const seed = index % effectiveColumns;

          const card = (
            <SiteStructuredCard
              title={title}
              meta={meta}
              sections={sections}
              image={image}
              button={button}
              ui={ui}
            />
          );

          return (
            <div key={item.id} className="h-full">
              {reveal ? (
                <SiteReveal
                  revealUi={revealUi}
                  seedOrder={seed}
                  staggerMs={60}
                  amount={0.1}
                >
                  {card}
                </SiteReveal>
              ) : (
                card
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

StructuredCardCellRenderer.displayName = "StructuredCardCellRenderer";

function clampColumns(value: unknown): StructuredCardColumns {
  return value === 1 || value === 2 || value === 3 ? value : 1;
}
