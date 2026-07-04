/**
 * @file apps/site/src/app/api/revalidate/route.ts
 * @layer site/app/api
 *
 * @description
 * Webhook de revalidation appelé par le Studio après publication.
 *
 * @remarks
 * Sécurité :
 * - Vérifie `x-revalidate-secret` si `COMPOZ_REVALIDATE_SECRET` est défini.
 *
 * Payload attendu :
 * - `{ websiteSlug: string; slugs: string[] }`
 *
 * Revalidation :
 * - Routes host-based : `/`, `/:pageSlug`, `/sitemap.xml`, `/robots.txt`.
 * - Routes fallback explicites : `/t/:websiteSlug`, `/t/:websiteSlug/:pageSlug`,
 *   `/t/:websiteSlug/sitemap.xml`, `/t/:websiteSlug/robots.txt`.
 *
 * Notes :
 * - `websiteSlug` correspond au `Website.slug` public.
 * - `slugs` correspond aux slugs des pages publiées.
 * - Best-effort : les slugs invalides sont normalisés/filtrés avant revalidation.
 */

import "server-only";

import { revalidatePath } from "next/cache";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { throwHttp } from "@compoz/http/http-error";
import { handleRoute } from "@compoz/site/lib/api/handle-route";
import { toSlug, toSlugsList } from "@compoz/ui/lib/routing/slug";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function hostedPathForPageSlug(pageSlug: string): string {
  return pageSlug === HOME_SLUG ? "/" : `/${pageSlug}`;
}

function fallbackPathForPageSlug(params: {
  websiteSlug: string;
  pageSlug: string;
}): string {
  const { websiteSlug, pageSlug } = params;

  return pageSlug === HOME_SLUG
    ? `/t/${websiteSlug}`
    : `/t/${websiteSlug}/${pageSlug}`;
}

function revalidatePublishedForWebsite(params: {
  websiteSlug: string;
  slugs: ReadonlyArray<string>;
}) {
  const { websiteSlug, slugs } = params;

  // -----------------------------------------------------------------------
  // A) Host-based public routes: "/", "/:pageSlug"
  // -----------------------------------------------------------------------
  revalidatePath("/");

  for (const pageSlug of slugs) {
    revalidatePath(hostedPathForPageSlug(pageSlug));
  }

  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");

  // -----------------------------------------------------------------------
  // B) Explicit fallback routes: "/t/:websiteSlug"
  // -----------------------------------------------------------------------
  revalidatePath(`/t/${websiteSlug}`);

  for (const pageSlug of slugs) {
    revalidatePath(fallbackPathForPageSlug({ websiteSlug, pageSlug }));
  }

  revalidatePath(`/t/${websiteSlug}/sitemap.xml`);
  revalidatePath(`/t/${websiteSlug}/robots.txt`);
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

    const payload = body as Record<string, unknown>;

    const websiteSlug = toSlug(payload.websiteSlug);
    const slugs = toSlugsList(payload.slugs);

    if (!websiteSlug) {
      throwHttp(400, {
        code: EC.VALIDATION_ERROR,
        message: "Missing websiteSlug",
        where: "api.site.revalidate.websiteSlug",
      });
    }

    revalidatePublishedForWebsite({ websiteSlug, slugs });

    return {
      ok: true,
      websiteSlug,
      revalidated: {
        hostBased: {
          home: true,
          pages: slugs.length,
          sitemap: true,
          robots: true,
        },
        fallback: {
          websiteHome: true,
          pages: slugs.length,
          sitemap: true,
          robots: true,
        },
      },
    };
  });
}
