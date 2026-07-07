/**
 * @file packages/validation/src/common/date.ts
 * @layer validation/common
 *
 * @description
 * Defines shared Zod helpers for strict ISO UTC date strings.
 *
 * @remarks
 * These schemas validate string shape and parseability only; domain-level date rules stay outside validation.
 */

import { z } from "zod";

/** ISO 8601 UTC pattern with optional milliseconds and a required `Z` suffix. */
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function isIsoUtc(value: string): boolean {
  if (value.trim() !== value) return false;
  if (!ISO_UTC_PATTERN.test(value)) return false;

  const time = Date.parse(value);
  return Number.isFinite(time);
}

export const IsoDateStringSchema = z.string().refine(isIsoUtc, {
  message: "Date ISO UTC invalide.",
});
