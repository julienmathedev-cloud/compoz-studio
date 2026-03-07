/**
 * @file apps/site/src/lib/api/handle-route.ts
 * @layer site/lib/api
 * @description
 * Enveloppe standard pour les handlers HTTP (Next.js App Router) côté Site :
 * - instrumentation (span)
 * - normalisation des erreurs (throwHttp + Zod + DomainError) en réponses JSON
 *
 * @remarks
 * - Pas de ContentState ici : le site public ne gère pas ?state=draft|published.
 * - Pas d’audit KV ici : inutile et ça évite du bruit.
 */

import type { NextResponse } from "next/server";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { toHttpError } from "@compoz/infra/http/error-adapter";
import { log, logSpan } from "@compoz/infra/lib/log";
import { jsonHttpError, jsonOk } from "@compoz/site/lib/api/responses";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ApiHandler<T> = (req: Request) => Promise<T>;

/* -------------------------------------------------------------------------- */
/* Main wrapper                                                                */
/* -------------------------------------------------------------------------- */

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
