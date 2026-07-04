/**
 * @file packages/ui/src/renderer/items/StructuredCardItemsRenderer.tsx
 * @layer ui/renderer/items
 *
 * @description
 * Site/preview renderer for structured card items.
 *
 * @remarks
 * - UI-only: consumes already validated item shapes.
 * - Ignores the renderer if no usable item is present.
 * - Columns and reveal behavior are owned by the parent cell.
 * - Items own the content.
 * - Uses `SiteStructuredCard` for visual rendering.
 * - Exposes stable `data-*` attributes for skins and Website overrides.
 */

import type { StructuredCardItemShape } from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import { SiteStructuredCard } from "@compoz/ui/site/components/molecules/SiteStructuredCard";
import type {
  SiteRevealPresetUi,
  SiteStructuredCardUi,
} from "@compoz/ui/site/site-ui.types";

export type StructuredCardItemsRendererProps = Readonly<{
  items?: ReadonlyArray<StructuredCardItemShape> | null;
  columns?: 1 | 2 | 3;
  reveal?: boolean;
  ui: SiteStructuredCardUi;
  revealUi: SiteRevealPresetUi;
}>;

type StructuredCardColumns = 1 | 2 | 3;
type PublicButtonIconPosition = "before" | "after";

function normalizePublicButtonIconPosition(
  iconPosition: string | null | undefined,
): PublicButtonIconPosition {
  return iconPosition === "after" ? "after" : "before";
}

export function StructuredCardItemsRenderer({
  items: rawItems,
  columns = 1,
  reveal = false,
  ui,
  revealUi,
}: StructuredCardItemsRendererProps) {
  if (!rawItems?.length) return null;

  const items = rawItems.filter((item) => {
    const title = normalizeString(item.title, "");
    const sections = item.sections.filter((section) => {
      const label = normalizeString(section.label, "");
      const content = normalizeString(section.content, "");
      return Boolean(label && content);
    });

    return Boolean(title && sections.length > 0);
  });

  if (items.length < 1) return null;

  const requestedColumns = clampColumns(columns);

  /**
   * Limit the layout to the real item count:
   * - 1 item  -> layout 1
   * - 2 items -> layout 2
   * - 3+      -> layout 3, within the requested layout limit
   */
  const effectiveColumns = Math.min(
    requestedColumns,
    items.length,
  ) as StructuredCardColumns;

  return (
    <div
      className={ui.root}
      data-card-items
      data-card-kind="structuredCard"
      data-card-columns={effectiveColumns}
      data-structured-card-columns={effectiveColumns}
      data-reveal={reveal ? "true" : "false"}
    >
      <div
        className={cn(ui.grid, ui.columns[effectiveColumns])}
        data-card-grid
        data-structured-card-grid
      >
        {items.map((item, index) => {
          const title = normalizeString(item.title, "");
          const meta = normalizeString(item.meta ?? "", "") || undefined;

          const sections = item.sections
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

          const buttonLabel = item.button
            ? normalizeString(item.button.label, "")
            : "";

          const button =
            item.button && buttonLabel
              ? {
                  label: buttonLabel,
                  href: normalizeString(item.button.href, ""),
                  variant: item.button.variant,
                  icon: item.button.icon,
                  iconPosition: normalizePublicButtonIconPosition(
                    item.button.iconPosition,
                  ),
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
            <div
              key={item.id}
              className="h-full"
              data-card-item
              data-structured-card-item
              data-card-index={index}
              data-structured-card-index={index}
              data-card-column={seed}
              data-structured-card-column={seed}
            >
              {reveal ? (
                <SiteReveal
                  revealUi={revealUi}
                  seedOrder={seed}
                  staggerMs={60}
                  amount={0.1}
                  className="h-full"
                >
                  <div
                    className="h-full"
                    data-card-content
                    data-structured-card-content
                  >
                    {card}
                  </div>
                </SiteReveal>
              ) : (
                <div
                  className="h-full"
                  data-card-content
                  data-structured-card-content
                >
                  {card}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

StructuredCardItemsRenderer.displayName = "StructuredCardItemsRenderer";

function clampColumns(value: unknown): StructuredCardColumns {
  return value === 1 || value === 2 || value === 3 ? value : 1;
}
