/**
 * @file packages/ui/src/lib/utils.ts
 * @layer ui/lib
 *
 * @description
 * Helper utilitaire pour combiner des classes CSS (clsx + tailwind-merge).
 *
 * @remarks
 * `cn()` combine :
 * - `clsx` : conditions, arrays, objets booléens
 * - `tailwind-merge` : résolution des conflits Tailwind
 *
 * Exemple :
 * <div className={cn("p-2", isActive && "bg-blue-500", "p-4")} />
 * → "bg-blue-500 p-4"
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
