"use client";

/**
 * @file apps/studio/src/features/dnd/DragHandle.tsx
 * @layer studio/features/dnd
 *
 * @description
 * Reusable drag handle button for Studio sortable lists.
 *
 * @remarks
 * - DnD behavior is provided by the parent dnd-kit sortable bindings.
 * - Shared by pages, menus, blocks, rows, columns, and cells.
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
