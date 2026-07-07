/**
 * @file apps/site/src/lib/api/handle-route.ts
 * @layer site/lib/api
 *
 * @description
 * Standard wrapper for Site App Router HTTP handlers.
 *
 * @remarks
 * - Wraps handlers in a log span and normalizes Domain/HTTP errors to JSON responses.
 * - The public site does not accept `?state=draft|published`; content state is resolved by public loaders.
 * - KV audit telemetry is intentionally not used here to keep public routes quiet.
 */

import type { NextResponse } from "next/server";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { toHttpError } from "@compoz/infra/http/error-adapter";
import { log, logSpan } from "@compoz/infra/lib/log";
import { jsonHttpError, jsonOk } from "@compoz/site/lib/api/responses";

type ApiHandler<T> = (req: Request) => Promise<T>;

export async function handleRoute<T>(
  ns: string,
  req: Request,
  handler: ApiHandler<T>,
): Promise<NextResponse> {
  const lg = log.child({ ns });
  const { pathname } = new URL(req.url);

  return logSpan(ns, { ns, method: req.method, path: pathname }, async () => {
    try {
      const data = await handler(req);
      return jsonOk<T>(data);
    } catch (err: unknown) {
      const dom = toHttpError(err);

      if (dom.body.code !== ERROR_CODES.UNKNOWN) {
        lg.warn("domain_error", {
          status: dom.status,
          code: dom.body.code,
        });

        return jsonHttpError(dom.status, dom.body);
      }

      lg.error("internal_error", {
        message: err instanceof Error ? err.message : String(err),
      });

      return jsonHttpError(500, {
        code: ERROR_CODES.INTERNAL,
        message: ERROR_CODES.INTERNAL,
      });
    }
  });
}
