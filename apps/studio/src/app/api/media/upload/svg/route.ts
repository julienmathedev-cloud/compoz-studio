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
  year: string;
  month: string;
  filename: string;
}): string {
  return `${args.year}/${args.month}/${args.filename}`;
}

export async function POST(req: Request) {
  const NS = "api.studio.media.upload.svg.POST" as const;

  return handleRoute(NS, req, async () => {
    const lg = log.child({ ns: NS });
    const storage = getMediaStorage();

    return logSpan(
      NS,
      {
        ns: NS,
        method: "POST",
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

        const origName = file.name || "logo";
        const safeBase = sanitizeFilename(origName.replace(/\.[^.]+$/, ""));

        const { y, m } = nowParts();
        const filename = `${safeBase}-${Date.now()}.svg`;
        const key = buildStorageKey({
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
          contentType,
          size,
          url: stored.url,
        });

        const res: UploadSvgResponse = {
          url: stored.url,
          filename,
          size,
          contentType,
        };

        return res;
      },
    );
  });
}
