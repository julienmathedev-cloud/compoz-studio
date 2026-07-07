/**
 * @file packages/core/src/domain/slug/utils.ts
 * @layer core/domain/slug
 * @description Slug normalization and route conversion helpers.
 * @remarks
 * Normalization is not validation; callers must still handle empty or invalid results.
 */

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import {
  HOME_SLUG,
  RESERVED_SLUGS,
  SLUG_FINAL_RE,
} from "@compoz/core/domain/slug/constants";

export function normalizeSlug(input: string, maxLen?: number): string {
  if (!input) return "";

  let s = input.trim().toLowerCase();
  if (!s) return "";

  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  s = s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (typeof maxLen === "number" && maxLen > 0 && s.length > maxLen) {
    s = s.slice(0, maxLen).replace(/-+$/g, "");
  }

  return s;
}

export function isValidSlug(s: string): boolean {
  return SLUG_FINAL_RE.test(s);
}

const RESERVED_SET = new Set<string>(RESERVED_SLUGS);

export function isReservedSlug(slug: string): boolean {
  const n = normalizeSlug(slug);
  return n.length > 0 && RESERVED_SET.has(n);
}

export function toInternalPathFromSlug(slug: string): string {
  const s = String(slug ?? "").trim();
  if (!s || s === HOME_SLUG) return SITE_PATH.home;
  return `/${s.replace(/^\/+/, "")}`;
}

export function normalizeSlugInput(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  if (raw === SITE_PATH.home) return HOME_SLUG;

  const stripped = raw.replace(/^\/+/, "").replace(/\/+$/, "");

  if (!stripped) return HOME_SLUG;

  return stripped;
}
