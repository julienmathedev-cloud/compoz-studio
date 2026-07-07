/**
 * @file apps/studio/src/app/api/media/upload/image/finalize/route.ts
 * @layer studio/app/api
 *
 * @description
 * Finalizes a temporary image upload linked to the active Studio Website:
 * reads the temporary blob, optimizes the image, writes the final media, then
 * deletes the temporary blob.
 *
 * @remarks
 * - Requires a valid Studio session.
 * - Temporary and final blobs are scoped by Prisma Website.id.
 * - The expected `tempKey` follows this convention:
 *   `websites/:websiteId/_tmp/media/...`
 * - Final media is written under:
 *   `websites/:websiteId/:year/:month/:filename`
 */

import "server-only";

import { randomUUID } from "node:crypto";

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
import {
  MediaAssetKind,
  MediaStorageProvider,
} from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

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

function currentMediaProvider(): MediaStorageProvider {
  return String(process.env["BLOB_READ_WRITE_TOKEN"] ?? "").trim()
    ? MediaStorageProvider.vercel_blob
    : MediaStorageProvider.local;
}

async function upsertMediaAsset(args: {
  websiteId: string;
  kind: MediaAssetKind;
  key: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  wasResized: boolean;
  wasCompressed: boolean;
}): Promise<string> {
  const provider = currentMediaProvider();

  const asset = await prisma.mediaAsset.upsert({
    where: {
      provider_key: {
        provider,
        key: args.key,
      },
    },
    create: {
      websiteId: args.websiteId,
      provider,
      kind: args.kind,
      key: args.key,
      url: args.url,
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      width: args.width,
      height: args.height,
      originalSize: args.originalSize,
      optimizedSize: args.optimizedSize,
      wasResized: args.wasResized,
      wasCompressed: args.wasCompressed,
    },
    update: {
      websiteId: args.websiteId,
      kind: args.kind,
      url: args.url,
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      width: args.width,
      height: args.height,
      originalSize: args.originalSize,
      optimizedSize: args.optimizedSize,
      wasResized: args.wasResized,
      wasCompressed: args.wasCompressed,
    },
  });

  return asset.id;
}

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
      const baseName = `${safeBase}-${Date.now()}-${randomUUID()}`;

      const urls: Partial<Record<number, string>> = {};
      const keys: Partial<Record<number, string>> = {};

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
        keys[px] = key;
      }

      const faviconKey = keys[32];
      const faviconUrl = urls[32];
      const faviconBuffer = favicons[32]?.buffer;

      if (!faviconKey || !faviconUrl || !faviconBuffer) {
        throwHttp(500, {
          code: EC.INTERNAL,
          message: EC.INTERNAL,
          details: {
            reason: "favicon_32_missing",
          },
        });
      }

      const filename = `${baseName}-32.png`;
      const optimizedSize = faviconBuffer.length;

      const mediaAssetId = await upsertMediaAsset({
        websiteId,
        kind: MediaAssetKind.favicon,
        key: faviconKey,
        url: faviconUrl,
        filename,
        contentType: "image/png",
        size: optimizedSize,
        width: 32,
        height: 32,
        originalSize,
        optimizedSize,
        wasResized: false,
        wasCompressed: false,
      });

      await storage.delete({ key: tempKey });

      const res: UploadImageResponse = {
        mediaAssetId,
        url: faviconUrl,
        filename,
        size: optimizedSize,
        width: 32,
        height: 32,
        contentType: "image/png",
        originalSize,
        optimizedSize,
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
     * Premium UX:
     * When no real transformation happened, flags are fully neutralized to
     * avoid unnecessary toasts.
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
    const filename = `${safeBase}-${Date.now()}-${randomUUID()}.${optimized.ext}`;

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

    const mediaAssetId = await upsertMediaAsset({
      websiteId,
      kind: MediaAssetKind.image,
      key,
      url: stored.url,
      filename,
      contentType: optimized.mime,
      size: optimizedSize,
      width,
      height,
      originalSize,
      optimizedSize,
      wasResized,
      wasCompressed,
    });

    await storage.delete({ key: tempKey });

    const res: UploadImageResponse = {
      mediaAssetId,
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
