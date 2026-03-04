/**
 * @file apps/site/src/app/api/revalidate/route.ts
 * @layer site/api
 * @description
 * Webhook de revalidation (appelé par Studio après publication).
 *
 * Sécurité :
 * - vérifie `x-revalidate-secret` si `COMPOZ_REVALIDATE_SECRET` est défini
 *
 * Payload :
 * - { tenantId: string; slugs: string[] }
 *
 * Remarques :
 * - On revalide :
 *   - le mode "host-based" (/) si tu utilises lvh.me / domaines mappés
 *   - ET le fallback vercel "/t/:tenant" (toujours safe, et pratique)
 * - Best-effort : si un slug est invalide, on le skip.
 */

import "server-only";

import { revalidatePath } from "next/cache";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";

import { handleRoute } from "@compoz/site/lib/api/handle-route";
import { jsonOk } from "@compoz/site/lib/api/responses";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeTenantId(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

function normalizeSlugs(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .filter((s) => s !== "home"); // home = "/"
}

function revalidatePublishedForTenant(params: {
  tenantId: string;
  slugs: ReadonlyArray<string>;
}) {
  const { tenantId, slugs } = params;

  // -----------------------------------------------------------------------
  // A) Host-based (lvh.me / domaine client)
  // -----------------------------------------------------------------------
  revalidatePath("/");

  for (const slug of slugs) {
    revalidatePath(`/${slug}`);
  }

  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");

  // -----------------------------------------------------------------------
  // B) Fallback vercel "/t/:tenant"
  // -----------------------------------------------------------------------
  revalidatePath(`/t/${tenantId}`);

  for (const slug of slugs) {
    revalidatePath(`/t/${tenantId}/${slug}`);
  }

  revalidatePath(`/t/${tenantId}/sitemap.xml`);
  revalidatePath(`/t/${tenantId}/robots.txt`);
}

/* -------------------------------------------------------------------------- */
/* POST                                                                       */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
  const NS = "api.site.revalidate.POST" as const;

  return handleRoute(NS, req, async () => {
    const secret = String(process.env["COMPOZ_REVALIDATE_SECRET"] ?? "").trim();
    const provided = String(
      req.headers.get("x-revalidate-secret") ?? "",
    ).trim();

    // Si un secret est configuré, il devient obligatoire
    if (secret && provided !== secret) {
      throwHttp(401, { code: EC.UNAUTHORIZED, message: EC.UNAUTHORIZED });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throwHttp(400, {
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
      });
    }

    const tenantId = normalizeTenantId(
      (body as Record<string, unknown>)?.tenantId,
    );
    const slugs = normalizeSlugs((body as Record<string, unknown>)?.slugs);

    if (!tenantId) {
      throwHttp(400, {
        code: EC.VALIDATION_ERROR,
        message: "Missing tenantId",
        where: "api.site.revalidate.tenantId",
      });
    }

    revalidatePublishedForTenant({ tenantId, slugs });

    return jsonOk(
      {
        ok: true,
        tenantId,
        revalidated: {
          hostBased: {
            home: true,
            pages: slugs.length,
            sitemap: true,
            robots: true,
          },
          fallback: {
            tenantHome: true,
            pages: slugs.length,
            sitemap: true,
            robots: true,
          },
        },
      },
      200,
    );
  });
}
