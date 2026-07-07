"use client";

/**
 * @file apps/studio/src/features/dnd/SortableItem.tsx
 * @layer studio/features/dnd
 *
 * @description
 * Generic dnd-kit sortable wrapper for Studio list items.
 *
 * @remarks
 * - Owns the sortable node ref and transform style.
 * - Exposes dnd-kit attributes and listeners through a render prop so callers can attach them to their chosen handle.
 */

import type { ReactNode } from "react";

import { useSortable } from "@dnd-kit/sortable";

type SortableRenderArgs = Pick<
  ReturnType<typeof useSortable>,
  "attributes" | "listeners"
>;

type SortableItemProps = Readonly<{
  id: string;
  children: (args: SortableRenderArgs) => ReactNode;
}>;

export function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}

SortableItem.displayName = "SortableItem";
