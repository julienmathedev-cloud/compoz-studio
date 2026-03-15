"use client";

/**
 * @file apps/studio/src/features/dnd/SortableItem.tsx
 * @layer ui/studio/dnd
 *
 * @description
 * Élément triable générique basé sur dnd-kit.
 */

import type { CSSProperties, ReactNode } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
