/**
 * @file packages/ui/src/renderer/cells/StepsCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated steps cell as an ordered visual sequence.
 *
 * @remarks
 * Items without a title are ignored; numbering follows the rendered order, and density is exposed through `data-density` for skin breakpoints.
 */

import type { StepsCellShape } from "@compoz/validation/pages/blocks/cells/cell";
import { ArrowDown } from "lucide-react";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteStepCard } from "@compoz/ui/site/components/molecules/SiteStepCard";
import type { SiteStepsUi } from "@compoz/ui/site/site-ui.types";

export type StepsCellRendererProps = Readonly<{
  cell?: StepsCellShape | null;
  ui: SiteStepsUi;
}>;

type StepsDensity = "default" | "dense";

export function StepsCellRenderer({ cell, ui }: StepsCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = cell.items.filter((item) => {
    const title = normalizeString(item.title, "");
    return Boolean(title);
  });

  if (items.length < 1) return null;

  const variant = cell.variant === "horizontal" ? "horizontal" : "vertical";
  const variantUi = ui.variants[variant];

  const density: StepsDensity = items.length > 4 ? "dense" : "default";
  const align = "center";

  return (
    <div
      className={cn(ui.root, variantUi.root)}
      data-cell="steps"
      data-variant={variant}
      data-density={density}
    >
      <div className={cn(variantUi.list)} data-density={density}>
        {items.map((item, index) => {
          const title = normalizeString(item.title, "");
          const description = normalizeString(item.description, "");
          const isLast = index === items.length - 1;

          return (
            <div key={item.id} className={cn(variantUi.item)}>
              <div className={cn(variantUi.cardRoot)} data-density={density}>
                <SiteStepCard
                  step={index + 1}
                  title={title}
                  description={description}
                  align={align}
                  ui={ui.card}
                />
              </div>

              {!isLast ? (
                <div
                  className={cn(variantUi.connector)}
                  data-density={density}
                  aria-hidden="true"
                >
                  <ArrowDown
                    className={cn(variantUi.connectorIcon)}
                    data-density={density}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

StepsCellRenderer.displayName = "StepsCellRenderer";
