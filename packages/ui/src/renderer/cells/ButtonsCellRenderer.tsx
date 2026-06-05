/**
 * @file packages/ui/src/renderer/cells/ButtonsCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Cell renderer site/preview : rendu d’un groupe de CTA.
 *
 * @remarks
 * - UI-only : consomme une shape déjà validée (schema).
 * - Rend une liste de liens stylés via `SiteButton`.
 * - Ignore uniquement les items sans libellé.
 * - Le root prend toute la largeur disponible.
 * - L’alignement est appliqué sur la liste interne.
 * - Le gap est piloté par la cell.
 */

import type { ButtonsCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { normalizeString } from "@compoz/ui/lib/normalize";
import { cn } from "@compoz/ui/lib/utils";
import { SiteButton } from "@compoz/ui/site/components/atoms/SiteButton";
import type { SiteButtonsUi } from "@compoz/ui/site/site-ui.types";

export type ButtonsCellRendererProps = Readonly<{
  cell?: ButtonsCellShape | null;
  ui: SiteButtonsUi;
}>;

type PublicButtonVariant = "default" | "secondary" | "outline" | "ghost";
type PublicButtonIconPosition = "before" | "after";

function normalizePublicButtonVariant(
  variant: string | null | undefined,
): PublicButtonVariant {
  switch (variant) {
    case "secondary":
      return "secondary";

    case "outline":
      return "outline";

    case "ghost":
      return "ghost";

    case "default":
    default:
      return "default";
  }
}

function normalizePublicButtonIconPosition(
  iconPosition: string | null | undefined,
): PublicButtonIconPosition {
  return iconPosition === "after" ? "after" : "before";
}

export function ButtonsCellRenderer({ cell, ui }: ButtonsCellRendererProps) {
  if (!cell?.items?.length) return null;

  const items = cell.items.filter((item) => {
    const label = normalizeString(item.label, "");
    return Boolean(label);
  });

  if (items.length < 1) return null;

  const align = cell.align ?? "left";
  const gap = cell.gap ?? "md";

  return (
    <div className={ui.root} data-cell="buttons">
      <div className={cn(ui.list, ui.align[align], ui.gap[gap])}>
        {items.map((item) => {
          const label = normalizeString(item.label, "");
          const href = normalizeString(item.href, "");
          const variant = normalizePublicButtonVariant(item.variant);
          const iconPosition = normalizePublicButtonIconPosition(
            item.iconPosition,
          );

          return (
            <SiteButton
              key={item.id}
              label={label}
              href={href}
              variant={variant}
              icon={item.icon}
              iconPosition={iconPosition}
              className={ui.button}
              ui={ui.buttonUi}
            />
          );
        })}
      </div>
    </div>
  );
}

ButtonsCellRenderer.displayName = "ButtonsCellRenderer";
