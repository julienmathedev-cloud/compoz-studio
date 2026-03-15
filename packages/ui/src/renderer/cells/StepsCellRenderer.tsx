/**
 * @file packages/ui/src/renderer/cells/StepsCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’une liste d’étapes.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée.
 * - Rend une liste verticale de `SiteStepCard`.
 * - Ignore les items sans titre.
 * - La numérotation est calculée automatiquement à partir de l’ordre.
 */

import type { StepsCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteStepCard } from "@compoz/ui/site/components/molecules/SiteStepCard";
import type { SiteStepsUi } from "@compoz/ui/site/site-ui.types";

export type StepsCellRendererProps = Readonly<{
  cell?: StepsCellShape | null;
  ui: SiteStepsUi;
}>;

export function StepsCellRenderer({ cell, ui }: StepsCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = cell.items.filter((item) => {
    const title = normalizeString(item.title, "");
    return Boolean(title);
  });

  if (items.length < 1) return null;

  const align = "left";

  return (
    <div className={ui.root} data-cell="steps">
      <div className={cn(ui.list)}>
        {items.map((item, index) => {
          const title = normalizeString(item.title, "");
          const description = normalizeString(item.description, "");

          return (
            <SiteStepCard
              key={item.id}
              step={index + 1}
              title={title}
              description={description}
              align={align}
              ui={ui.card}
            />
          );
        })}
      </div>
    </div>
  );
}

StepsCellRenderer.displayName = "StepsCellRenderer";
