"use client";

/**
 * @file apps/studio/src/features/dnd/DragHandle.tsx
 * @layer ui/studio/dnd
 *
 * @description
 * Poignée de drag utilisée dans les listes réordonnables du studio.
 *
 * @remarks
 * - Purement visuel : la logique DnD est fournie par `@dnd-kit`.
 * - Réutilisable pour pages, menus, blocks, rows, columns et cells.
 */

import type { ComponentPropsWithoutRef } from "react";

import { GripVertical } from "lucide-react";

import { cn } from "@compoz/ui/lib/utils";

type DragHandleProps = Readonly<
  ComponentPropsWithoutRef<"button"> & {
    className?: string;
  }
>;

export function DragHandle({
  className,
  type = "button",
  ...props
}: DragHandleProps) {
  return (
    <button
      type={type}
      className={cn(
        "flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
      aria-label="Drag"
      {...props}
    >
      <GripVertical size={16} />
    </button>
  );
}

DragHandle.displayName = "DragHandle";
