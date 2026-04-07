"use client";

/**
 * @file apps/studio/src/components/molecules/controls/HelperChips.tsx
 * @layer studio/molecules
 *
 * @description
 * Composant réutilisable : série de petits boutons permettant d’insérer des snippets
 * ou valeurs dans un champ de formulaire.
 *
 * @remarks
 * - Peut être utilisé pour les champs SEO (titleTemplate, robots) ou tout champ nécessitant des boutons d’aide.
 * - Rend `null` si la liste `items` est vide.
 */

import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import { ROW_SM } from "@compoz/ui/styles/studio/layout";

type HelperChipsProps = Readonly<{
  items: ReadonlyArray<string>;
  onPick: (value: string) => void;
}>;

export function HelperChips({ items, onPick }: HelperChipsProps) {
  if (!items.length) return null;

  return (
    <div className={cn("flex-wrap", ROW_SM)}>
      {items.map((item, index) => (
        <Button
          key={`helper-chip-${item}-${index}`}
          type="button"
          variant="ghost"
          visualMode="studio"
          size="sm"
          onClick={() => onPick(item)}
        >
          {item}
        </Button>
      ))}
    </div>
  );
}

HelperChips.displayName = "HelperChips";
