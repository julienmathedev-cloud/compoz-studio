/**
 * @file packages/ui/src/renderer/cells/CaseStudyCardCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’une grille de case study cards.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée (schema).
 * - Ignore la cellule si aucun item exploitable n’est présent.
 * - La cellule porte le layout (`columns`), les items portent le contenu.
 * - Utilise `SiteCaseStudyCard` pour le rendu visuel de chaque item.
 */

import type { CaseStudyCardCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteCaseStudyCard } from "@compoz/ui/site/components/molecules/SiteCaseStudyCard";
import type { SiteCaseStudyCardUi } from "@compoz/ui/site/site-ui.types";

export type CaseStudyCardCellRendererProps = Readonly<{
  cell?: CaseStudyCardCellShape | null;
  ui: SiteCaseStudyCardUi;
}>;

export function CaseStudyCardCellRenderer({
  cell,
  ui,
}: CaseStudyCardCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = cell.items.filter((item) => {
    const title = normalizeString(item.title, "");
    const context = normalizeString(item.context, "");
    const solution = normalizeString(item.solution, "");
    const result = normalizeString(item.result, "");

    return Boolean(title && context && solution && result);
  });

  if (items.length < 1) return null;

  const columns = cell.columns ?? 1;

  return (
    <div className={ui.root} data-cell="caseStudyCard">
      <div className={cn(ui.grid, ui.columns[columns])}>
        {items.map((item) => {
          const title = normalizeString(item.title, "");
          const context = normalizeString(item.context, "");
          const solution = normalizeString(item.solution, "");
          const result = normalizeString(item.result, "");

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

          return (
            <SiteCaseStudyCard
              key={item.id}
              title={title}
              context={context}
              solution={solution}
              result={result}
              image={image}
              ui={ui}
            />
          );
        })}
      </div>
    </div>
  );
}

CaseStudyCardCellRenderer.displayName = "CaseStudyCardCellRenderer";
