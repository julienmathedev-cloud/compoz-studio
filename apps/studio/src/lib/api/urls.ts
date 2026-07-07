/**
 * @file apps/studio/src/lib/api/urls.ts
 * @layer studio/lib/api
 *
 * @description
 * URL parsing helpers for App Router API routes.
 *
 * @remarks
 * - Strict convention: only `?state=published` is explicitly accepted.
 * - Missing, invalid, or unsupported values fall back to the provided default state.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";

/** Extracts the requested `ContentState` from an API request query string. */
export function parseContentStateFromRequest(
  req: Request,
  fallback: ContentState = CONTENT_STATE.DRAFT,
): ContentState {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("state");
  if (!raw) return fallback;

  const state = raw.trim().toLowerCase();
  return state === CONTENT_STATE.PUBLISHED ? CONTENT_STATE.PUBLISHED : fallback;
}
