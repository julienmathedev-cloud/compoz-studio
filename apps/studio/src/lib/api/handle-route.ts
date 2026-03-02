/**
 * @file apps/studio/src/lib/api/handle-route.ts
 * @layer admin/lib/api
 * @description
 * Enveloppe standard pour les handlers HTTP (Next.js App Router) :
 * - résolution du ContentState (?state=draft|published),
 * - instrumentation (span),
 * - normalisation des erreurs (Zod + DomainError) en réponses JSON,
 * - audit KV optionnel.
 */
import type { ContentState } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { toHttpError } from "@compoz/infra/http/error-adapter";
import {
  autoDumpKvStats,
  kvAuditEnabled,
  resetKvStats,
} from "@compoz/infra/kv/kv-telemetry";
import { log, logSpan } from "@compoz/infra/lib/log";
import { parseContentStateFromRequest } from "@compoz/studio/lib/api//urls";
import { jsonHttpError, jsonOk } from "@compoz/studio/lib/api/responses";
import type { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type HandlerProps = {
  req: Request;
  state: ContentState;
};

type ApiHandler<T> = (props: HandlerProps) => Promise<T>;

/* -------------------------------------------------------------------------- */
/* Main wrapper                                                                */
/* -------------------------------------------------------------------------- */

export async function handleRoute<T>(
  ns: string,
  req: Request,
  handler: ApiHandler<T>,
): Promise<NextResponse> {
  const lg = log.child({ ns });

  const state = parseContentStateFromRequest(req);
  const { pathname: path } = new URL(req.url);

  const audit = kvAuditEnabled();
  if (audit) resetKvStats();

  return logSpan(ns, { ns, state, method: req.method, path }, async () => {
    try {
      const data = await handler({ req, state });
      return jsonOk<T>(data);
    } catch (err: unknown) {
      const dom = toHttpError(err);

      if (dom.body.code !== ERROR_CODES.UNKNOWN) {
        lg.warn("domain_error", {
          state,
          status: dom.status,
          code: dom.body.code,
        });

        return jsonHttpError(dom.status, dom.body);
      }

      lg.error("internal_error", {
        state,
        message: err instanceof Error ? err.message : String(err),
      });

      return jsonHttpError(500, {
        code: ERROR_CODES.INTERNAL,
        message: ERROR_CODES.INTERNAL,
      });
    } finally {
      if (audit) autoDumpKvStats(ns);
    }
  });
}
