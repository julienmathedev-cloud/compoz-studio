/**
 * @file apps/studio/src/app/api/media/upload/image/finalize/route.ts
 * @layer studio/app/api
 *
 * @description
 * Finalise un upload image temporaire lié au Website actif du Studio :
 * relit le blob temp, optimise l’image, écrit le média final, puis supprime le temp.
 *
 * @remarks
 * - Nécessite une session Studio valide.
 * - Les blobs temporaires et finaux sont scopés par Prisma Website.id.
 * - Le `tempKey` attendu suit la convention :
 *   `websites/:websiteId/_tmp/media/...`
 * - Le média final est écrit sous :
 *   `websites/:websiteId/:year/:month/:filename`
 */

import "server-only";

import sharp from "sharp";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";
import type {
  FinalizeImageUploadRequest,
  UploadImageKind,
  UploadImageResponse,
} from "@compoz/infra/http/studio/media.types";
import {
  FAVICON_SIZES,
  generateFaviconSet,
  optimizeContentImage,
  optimizeLogo,
  optimizeOgImage,
} from "@compoz/infra/media/optimizers";
import { getMediaStorage } from "@compoz/infra/media/storage";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, key: string): string {
  if (!isRecord(value)) return "";

  const raw = value[key];

  return typeof raw === "string" ? raw : "";
}

function readNumber(value: unknown, key: string): number {
  if (!isRecord(value)) return 0;

  const raw = value[key];

  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}

function isUploadKind(input: string): input is UploadImageKind {
  return (
    input === "content" ||
    input === "og" ||
    input === "logo" ||
    input === "favicon"
  );
}

function sanitizeFilename(name: string): string {
  const base = name.normalize("NFKC").toLowerCase().replace(/\s+/g, "-");
  const trimmed = base.slice(0, 80);

  return trimmed.replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
}

function nowParts(d = new Date()) {
  const year = String(d.getUTCFullYear());
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");

  return { year, month };
}

function buildStorageKey(args: {
  websiteId: string;
  year: string;
  month: string;
  filename: string;
}): string {
  return `websites/${args.websiteId}/${args.year}/${args.month}/${args.filename}`;
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
  const NS = "api.studio.media.upload.image.finalize.POST" as const;

  return handleRoute(NS, req, async () => {
    const storage = getMediaStorage();
    const { websiteId } = await requireSessionWithWebsite();

    const body = (await req.json()) as FinalizeImageUploadRequest;

    const tempKey = readString(body, "tempKey").trim();
    const kind = readString(body, "kind").trim();
    const originalFilename = readString(body, "originalFilename").trim();
    const originalContentType = readString(body, "originalContentType").trim();
    const originalSize = readNumber(body, "originalSize");

    if (
      !tempKey ||
      !originalFilename ||
      !originalContentType ||
      originalSize <= 0
    ) {
      throwHttp(400, {
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
      });
    }

    if (!isUploadKind(kind)) {
      throwHttp(400, {
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: {
          field: "kind",
          received: kind,
        },
      });
    }

    assertWebsiteTempKey(tempKey, websiteId);

    const temp = await storage.read({ key: tempKey });
    const inputBuffer = temp.buffer;

    if (kind === "favicon") {
      const favicons = await generateFaviconSet(inputBuffer);
      const safeBase = sanitizeFilename(
        originalFilename.replace(/\.[^.]+$/, ""),
      );
      const { year, month } = nowParts();
      const baseName = `${safeBase}-${Date.now()}`;

      const urls: Record<number, string> = {};

      for (const px of FAVICON_SIZES) {
        const filename = `${baseName}-${px}.png`;
        const key = buildStorageKey({
          websiteId,
          year,
          month,
          filename,
        });

        const stored = await storage.put({
          key,
          buffer: favicons[px].buffer,
          contentType: "image/png",
        });

        urls[px] = stored.url;
      }

      await storage.delete({ key: tempKey });

      const res: UploadImageResponse = {
        url: urls[32],
        filename: `${baseName}-32.png`,
        size: favicons[32].buffer.length,
        width: 32,
        height: 32,
        contentType: "image/png",
        originalSize,
        optimizedSize: favicons[32].buffer.length,
        wasResized: false,
        wasCompressed: false,
      };

      return res;
    }

    const optimized =
      kind === "og"
        ? await optimizeOgImage(inputBuffer, originalContentType)
        : kind === "logo"
          ? await optimizeLogo(inputBuffer, originalContentType)
          : await optimizeContentImage(inputBuffer, originalContentType);

    const meta = await sharp(optimized.buffer).metadata();

    const width = Number(meta.width ?? 0);
    const height = Number(meta.height ?? 0);

    if (width <= 0 || height <= 0) {
      throwHttp(400, {
        code: EC.INVALID_ARGUMENT,
        message: EC.UPLOAD_IMAGE_DIMENSIONS_INVALID,
        details: {
          width,
          height,
        },
      });
    }

    const optimizedSize = optimized.buffer.length;

    /**
     * Premium UX :
     * Si aucune transformation réelle n’a eu lieu,
     * on neutralise totalement les flags
     * pour éviter les toasts inutiles.
     */
    const wasResized =
      optimized.originalWidth > 0 &&
      optimized.originalHeight > 0 &&
      (optimized.originalWidth !== optimized.finalWidth ||
        optimized.originalHeight !== optimized.finalHeight);

    const mimeChanged = optimized.mime !== originalContentType;
    const wasCompressed = mimeChanged || optimizedSize < originalSize;

    const safeBase = sanitizeFilename(originalFilename.replace(/\.[^.]+$/, ""));
    const { year, month } = nowParts();
    const filename = `${safeBase}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${optimized.ext}`;

    const key = buildStorageKey({
      websiteId,
      year,
      month,
      filename,
    });

    const stored = await storage.put({
      key,
      buffer: optimized.buffer,
      contentType: optimized.mime,
    });

    await storage.delete({ key: tempKey });

    const res: UploadImageResponse = {
      url: stored.url,
      filename,
      size: optimizedSize,
      width,
      height,
      contentType: optimized.mime,
      originalSize,
      optimizedSize,
      wasResized,
      wasCompressed,
    };

    return res;
  });
}
