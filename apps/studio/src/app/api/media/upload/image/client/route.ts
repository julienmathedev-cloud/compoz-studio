/**
 * @file apps/studio/src/app/api/media/upload/image/client/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route Vercel Blob de génération de client token pour l’upload direct
 * d’un blob image temporaire lié au Website actif du Studio.
 *
 * @remarks
 * - Nécessite une session Studio valide.
 * - Les uploads temporaires sont scopés par Prisma Website.id.
 * - Le `tempKey` attendu suit la convention :
 *   `websites/:websiteId/_tmp/media/...`
 */

import "server-only";

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { z } from "zod";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";
import type {
  UploadImageClientPayload,
  UploadImageKind,
} from "@compoz/infra/http/studio/media.types";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";

const MAX_IMAGE_UPLOAD_BYTES = Number(
  process.env["MAX_IMAGE_UPLOAD_BYTES"] ?? 5_000_000,
);

const ALLOWED_MIMES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
] as const;

const UploadImageClientPayloadSchema = z.object({
  tempKey: z.string().trim().min(1),
  kind: z.string().trim().min(1),
  originalFilename: z.string().trim().min(1),
  originalContentType: z.string().trim().min(1),
  originalSize: z.number().positive(),
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isUploadKind(input: string): input is UploadImageKind {
  return (
    input === "content" ||
    input === "og" ||
    input === "logo" ||
    input === "favicon"
  );
}

async function parseClientPayload(
  raw: string | null | undefined,
): Promise<UploadImageClientPayload> {
  if (!raw) {
    throwHttp(400, {
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { field: "clientPayload" },
    });
  }

  let parsedJson: unknown;

  try {
    parsedJson = await new Response(raw, {
      headers: { "content-type": "application/json" },
    }).json();
  } catch {
    throwHttp(400, {
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { field: "clientPayload" },
    });
  }

  const parsed = parseDTOOrHttp(UploadImageClientPayloadSchema, parsedJson, {
    code: EC.INVALID_ARGUMENT,
    message: EC.INVALID_ARGUMENT,
    extras: { field: "clientPayload" },
  });

  if (!isUploadKind(parsed.kind)) {
    throwHttp(400, {
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: {
        field: "clientPayload.kind",
        received: parsed.kind,
      },
    });
  }

  return {
    tempKey: parsed.tempKey,
    kind: parsed.kind,
    originalFilename: parsed.originalFilename,
    originalContentType: parsed.originalContentType,
    originalSize: parsed.originalSize,
  };
}

function assertWebsiteTempKey(tempKey: string, websiteId: string): void {
  const expectedPrefix = `websites/${websiteId}/_tmp/media/`;

  if (!tempKey.startsWith(expectedPrefix)) {
    throwHttp(400, {
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: {
        field: "tempKey",
        received: tempKey,
        expectedPrefix,
      },
    });
  }
}

/* -------------------------------------------------------------------------- */
/* POST                                                                       */
/* -------------------------------------------------------------------------- */

export async function POST(req: Request) {
  const NS = "api.studio.media.upload.image.client.POST" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();
    const body = (await req.json()) as HandleUploadBody;

    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = await parseClientPayload(clientPayload);

        if (pathname !== payload.tempKey) {
          throwHttp(400, {
            code: EC.INVALID_ARGUMENT,
            message: EC.INVALID_ARGUMENT,
            details: {
              field: "pathname",
              received: pathname,
              expected: payload.tempKey,
            },
          });
        }

        assertWebsiteTempKey(payload.tempKey, websiteId);

        return {
          allowedContentTypes: Array.from(ALLOWED_MIMES),
          maximumSizeInBytes: MAX_IMAGE_UPLOAD_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            websiteId,
            tempKey: payload.tempKey,
          }),
        };
      },
      onUploadCompleted: async () => {
        return;
      },
    });

    if (json.type === "blob.generate-client-token") {
      return { clientToken: json.clientToken };
    }

    return { ok: true };
  });
}
