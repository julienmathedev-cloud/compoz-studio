/**
 * @file packages/ui/src/lib/utils.ts
 * @layer ui/lib/utils
 * @description Combines conditional class values and resolves Tailwind conflicts.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
