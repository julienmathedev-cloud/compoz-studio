"use client";

/**
 * @file apps/studio/src/components/molecules/controls/HelperChips.tsx
 * @layer studio/molecules
 *
 * @description
 * Reusable helper chips for inserting snippets or values into form fields.
 *
 * @remarks
 * - Useful for SEO fields such as `titleTemplate` and `robots`, or any field that benefits from insertion shortcuts.
 * - Renders `null` when `items` is empty.
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
