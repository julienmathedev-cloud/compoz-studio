"use client";

/**
 * @file apps/studio/src/features/dnd/SortableProvider.tsx
 * @layer ui/studio/dnd
 *
 * @description
 * Wrapper générique pour les listes triables via dnd-kit.
 *
 * @remarks
 * - Gère DndContext + SortableContext.
 * - Déclenche `onReorder` avec les ids réordonnés.
 */

import type { ReactNode } from "react";

import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

type SortableProviderProps = Readonly<{
  ids: string[];
  onReorder: (ids: string[]) => Promise<void> | void;
  children: ReactNode;
}>;

export function SortableProvider({
  ids,
  onReorder,
  children,
}: SortableProviderProps) {
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newOrder = arrayMove(ids, oldIndex, newIndex);

    await onReorder(newOrder);
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

SortableProvider.displayName = "SortableProvider";
