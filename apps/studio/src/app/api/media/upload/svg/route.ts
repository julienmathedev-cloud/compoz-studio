/**
 * @file apps/studio/src/app/api/media/upload/svg/route.ts
 * @layer studio/app/api
 *
 * @description
 * Safe SVG upload route for the active Website media storage.
 *
 * @remarks
 * - Requires a valid Studio session.
 * - SVG media is scoped by Prisma Website.id.
 * - Final media is written under:
 *   `websites/:websiteId/:year/:month/:filename`
 */

import "server-only";

import { randomUUID } from "node:crypto";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";
import type { UploadSvgResponse } from "@compoz/infra/http/studio/media.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getMediaStorage } from "@compoz/infra/media/storage";
import {
  MediaAssetKind,
  MediaStorageProvider,
} from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

const MAX_IMAGE_UPLOAD_BYTES = Number(
  process.env["MAX_IMAGE_UPLOAD_BYTES"] ?? 5_000_000,
);

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

async function upsertSvgMediaAsset(args: {
  websiteId: string;
  key: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  width: number;
  height: number;
}): Promise<string> {
  const provider = MediaStorageProvider.vercel_blob;

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
      kind: MediaAssetKind.svg,
      key: args.key,
      url: args.url,
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      width: args.width,
      height: args.height,
    },
    update: {
      websiteId: args.websiteId,
      kind: MediaAssetKind.svg,
      url: args.url,
      filename: args.filename,
      contentType: args.contentType,
      size: args.size,
      width: args.width,
      height: args.height,
    },
  });

  return asset.id;
}

function parseSvgLength(raw: string | null | undefined): number | null {
  if (!raw) return null;

  const value = raw.trim().toLowerCase();

  if (!value) return null;

  // Accept positive unitless or pixel lengths only.
  const match = value.match(/^([0-9]+(?:\.[0-9]+)?)(px)?$/);

  if (!match) return null;

  const n = Number(match[1]);

  if (!Number.isFinite(n) || n <= 0) return null;

  return n;
}

function extractSvgDimensions(
  svg: string,
): { width: number; height: number } | null {
  const svgTagMatch = svg.match(/<svg\b[^>]*>/i);

  if (!svgTagMatch) return null;

  const svgTag = svgTagMatch[0];

  const widthAttr = svgTag.match(/\bwidth\s*=\s*["']([^"']+)["']/i)?.[1];
  const heightAttr = svgTag.match(/\bheight\s*=\s*["']([^"']+)["']/i)?.[1];

  const width = parseSvgLength(widthAttr);
  const height = parseSvgLength(heightAttr);

  if (width && height) {
    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  const viewBoxAttr = svgTag.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1];

  if (!viewBoxAttr) return null;

  const parts = viewBoxAttr
    .trim()
    .split(/[\s,]+/)
    .map((part) => Number(part));

  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }

  const viewBoxWidth = parts[2];
  const viewBoxHeight = parts[3];

  if (viewBoxWidth <= 0 || viewBoxHeight <= 0) {
    return null;
  }

  return {
    width: Math.round(viewBoxWidth),
    height: Math.round(viewBoxHeight),
  };
}

export async function POST(req: Request) {
  const NS = "api.studio.media.upload.svg.POST" as const;

  return handleRoute(NS, req, async () => {
    const logger = log.child({ ns: NS });
    const { websiteId } = await requireSessionWithWebsite();
    const storage = getMediaStorage();

    return logSpan(
      NS,
      {
        ns: NS,
        method: "POST",
        websiteId,
        contentTypeHeader: req.headers.get("content-type") ?? undefined,
      },
      async () => {
        const form = await req.formData();
        const file = form.get("file");

        if (!(file instanceof File)) {
          throwHttp(400, {
            code: EC.INVALID_ARGUMENT,
            message: EC.UPLOAD_FILE_MISSING,
            details: { field: "file" },
          });
        }

        const contentType = String(file.type || "");
        const size = Number(file.size || 0);

        if (contentType !== "image/svg+xml") {
          throwHttp(415, {
            code: EC.UNSUPPORTED_MEDIA_TYPE,
            message: EC.UPLOAD_MIME_NOT_ALLOWED,
            details: {
              allowed: ["image/svg+xml"],
              received: contentType,
            },
          });
        }

        if (size <= 0) {
          throwHttp(400, {
            code: EC.INVALID_ARGUMENT,
            message: EC.UPLOAD_EMPTY_FILE,
          });
        }

        if (size > MAX_IMAGE_UPLOAD_BYTES) {
          throwHttp(413, {
            code: EC.PAYLOAD_TOO_LARGE,
            message: EC.UPLOAD_FILE_TOO_LARGE,
            details: {
              maxBytes: MAX_IMAGE_UPLOAD_BYTES,
              receivedBytes: size,
            },
          });
        }

        const text = await file.text();
        const lower = text.toLowerCase();

        const forbiddenPatterns = [
          "<script",
          "<foreignobject",
          "<iframe",
          "onload=",
          "onclick=",
          "onmouseover=",
          "xlink:href",
          "href=",
        ];

        const hit = forbiddenPatterns.find((pattern) =>
          lower.includes(pattern),
        );

        if (hit) {
          throwHttp(415, {
            code: EC.UNSUPPORTED_MEDIA_TYPE,
            message: EC.UPLOAD_SVG_NOT_SAFE,
            details: {
              received: contentType,
              reason: "forbidden_svg_pattern",
              pattern: hit,
            },
          });
        }

        const dimensions = extractSvgDimensions(text);

        if (!dimensions) {
          throwHttp(422, {
            code: EC.INVALID_ARGUMENT,
            message: EC.UPLOAD_SVG_NOT_SAFE,
            details: {
              reason: "svg_dimensions_missing_or_invalid",
            },
          });
        }

        const originalName = file.name || "logo";
        const safeBase = sanitizeFilename(originalName.replace(/\.[^.]+$/, ""));

        const { year, month } = nowParts();
        const filename = `${safeBase}-${Date.now()}-${randomUUID()}.svg`;

        const key = buildStorageKey({
          websiteId,
          year,
          month,
          filename,
        });

        const stored = await storage.put({
          key,
          buffer: Buffer.from(text),
          contentType,
        });

        logger.debug("upload.svg.ok", {
          websiteId,
          contentType,
          size,
          width: dimensions.width,
          height: dimensions.height,
          url: stored.url,
        });

        const mediaAssetId = await upsertSvgMediaAsset({
          websiteId,
          key,
          url: stored.url,
          filename,
          contentType,
          size,
          width: dimensions.width,
          height: dimensions.height,
        });

        const res: UploadSvgResponse = {
          mediaAssetId,
          url: stored.url,
          filename,
          size,
          width: dimensions.width,
          height: dimensions.height,
          contentType,
        };

        return res;
      },
    );
  });
}
