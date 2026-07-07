/**
 * @file packages/infra/src/http/internal.ts
 * @layer infra/http
 * @description Shared HTTP client helpers for Studio fetchers.
 * @remarks
 * Helpers stay at the HTTP boundary: query serialization, route segment encoding, and fetch options.
 */

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";

export function withState(path: string, state: ContentState): string {
  if (state === DEFAULT_CONTENT_STATE) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}state=${state}`;
}

export type HttpOpts = Readonly<{ signal?: AbortSignal }>;

export function encodeSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

export function assertJsonResponse<T>(res: T | null, errorMessage: string): T {
  if (!res) {
    throw new Error(errorMessage);
  }
  return res;
}
