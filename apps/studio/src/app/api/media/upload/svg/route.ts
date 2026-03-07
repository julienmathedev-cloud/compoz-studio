/**
 * @file apps/studio/src/app/api/media/upload/svg/route.ts
 * @layer studio/app/api
 * @description
 * Upload SVG “safe” (logo) vers public/uploads/YYYY/MM.
 */

import "server-only";

import { join } from "node:path";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";
import type { UploadSvgResponse } from "@compoz/infra/http/studio/media.types";
import { ensureDirForFile, writeFileAtomic } from "@compoz/infra/lib/fs";
import { log, logSpan } from "@compoz/infra/lib/log";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

const UPLOADS_ROOT =
  process.env["PUBLIC_UPLOADS_DIR"] ?? join(process.cwd(), "public", "uploads");

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

export async function POST(req: Request) {
  const NS = "api.studio.media.upload.svg.POST" as const;

  return handleRoute(NS, req, async () => {
    const lg = log.child({ ns: NS });

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

        // “Safe-ish” check (V0.5 minimal et défensif)
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
        const absPath = join(UPLOADS_ROOT, y, m, filename);

        await ensureDirForFile(absPath);
        await writeFileAtomic(absPath, Buffer.from(text));

        const url = `/uploads/${y}/${m}/${filename}`;

        lg.debug("upload.svg.ok", { contentType, size, url });

        const res: UploadSvgResponse = { url, filename, size, contentType };
        return res;
      },
    );
  });
}
