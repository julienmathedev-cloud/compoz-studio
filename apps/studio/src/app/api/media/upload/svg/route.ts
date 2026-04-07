/**
 * @file apps/studio/src/app/api/media/upload/svg/route.ts
 * @layer studio/app/api
 * @description
 * Upload SVG “safe” (logo) vers le storage média.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";
import type { UploadSvgResponse } from "@compoz/infra/http/studio/media.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getMediaStorage } from "@compoz/infra/media/storage";
import { requireSessionWithTenant } from "@compoz/studio/auth/require-session";
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
  const y = String(d.getUTCFullYear());
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return { y, m };
}

function buildStorageKey(args: {
  tenantId: string;
  year: string;
  month: string;
  filename: string;
}): string {
  return `tenants/${args.tenantId}/${args.year}/${args.month}/${args.filename}`;
}

function parseSvgLength(raw: string | null | undefined): number | null {
  if (!raw) return null;

  const value = raw.trim().toLowerCase();
  if (!value) return null;

  /**
   * On accepte uniquement des longueurs en unités CSS/px raisonnables
   * ou unitless (interprétées comme px).
   *
   * Exemples acceptés :
   * - "240"
   * - "240px"
   */
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

  const vbWidth = parts[2];
  const vbHeight = parts[3];

  if (vbWidth <= 0 || vbHeight <= 0) {
    return null;
  }

  return {
    width: Math.round(vbWidth),
    height: Math.round(vbHeight),
  };
}

export async function POST(req: Request) {
  const NS = "api.studio.media.upload.svg.POST" as const;

  return handleRoute(NS, req, async () => {
    const lg = log.child({ ns: NS });
    const storage = getMediaStorage();
    const { tenantId } = await requireSessionWithTenant();

    return logSpan(
      NS,
      {
        ns: NS,
        method: "POST",
        tenantId,
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
            details: { maxBytes: MAX_IMAGE_UPLOAD_BYTES, receivedBytes: size },
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

        const hit = forbiddenPatterns.find((p) => lower.includes(p));
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

        const origName = file.name || "logo";
        const safeBase = sanitizeFilename(origName.replace(/\.[^.]+$/, ""));

        const { y, m } = nowParts();
        const filename = `${safeBase}-${Date.now()}.svg`;
        const key = buildStorageKey({
          tenantId,
          year: y,
          month: m,
          filename,
        });

        const stored = await storage.put({
          key,
          buffer: Buffer.from(text),
          contentType,
        });

        lg.debug("upload.svg.ok", {
          tenantId,
          contentType,
          size,
          width: dimensions.width,
          height: dimensions.height,
          url: stored.url,
        });

        const res: UploadSvgResponse = {
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
