/**
 * @file apps/studio/src/app/api/media/upload/image/route.ts
 * @layer api/routes
 * @description
 * Upload images raster (png/jpg/webp/gif/ico) vers public/uploads/YYYY/MM
 * avec optimisation automatique via Sharp.
 */

import { join } from "node:path";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";
import type { UploadImageResponse } from "@compoz/infra/http/studio/media.types";
import { ensureDirForFile, writeFileAtomic } from "@compoz/infra/lib/fs";
import { log, logSpan } from "@compoz/infra/lib/log";
import type { optimizeFavicon } from "@compoz/infra/media/optimizers";
import {
  FAVICON_SIZES,
  generateFaviconSet,
  optimizeContentImage,
  optimizeLogo,
  optimizeOgImage,
} from "@compoz/infra/media/optimizers";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import sharp from "sharp";

const UPLOADS_ROOT =
  process.env["PUBLIC_UPLOADS_DIR"] ?? join(process.cwd(), "public", "uploads");

const MAX_IMAGE_UPLOAD_BYTES = Number(
  process.env["MAX_IMAGE_UPLOAD_BYTES"] ?? 5_000_000,
);

const IMAGE_MIME_PREFIX = "image/";

const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

type UploadKind = "content" | "og" | "logo" | "favicon";

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
  const NS = "api.admin.media.upload.image.POST" as const;

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

        if (!contentType.startsWith(IMAGE_MIME_PREFIX)) {
          throwHttp(415, {
            code: EC.UNSUPPORTED_MEDIA_TYPE,
            message: EC.UPLOAD_IMAGE_REQUIRED,
            details: {
              expectedPrefix: IMAGE_MIME_PREFIX,
              received: contentType,
            },
          });
        }

        if (!ALLOWED_MIMES.has(contentType)) {
          throwHttp(415, {
            code: EC.UNSUPPORTED_MEDIA_TYPE,
            message: EC.UPLOAD_MIME_NOT_ALLOWED,
            details: {
              allowed: Array.from(ALLOWED_MIMES),
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

        // 🔥 lecture kind via query param
        const urlObj = new URL(req.url);
        const kind =
          (urlObj.searchParams.get("kind") as UploadKind) ?? "content";

        const inputBuffer = Buffer.from(await file.arrayBuffer());

        let optimized:
          | Awaited<ReturnType<typeof optimizeContentImage>>
          | Awaited<ReturnType<typeof optimizeOgImage>>
          | Awaited<ReturnType<typeof optimizeLogo>>
          | Awaited<ReturnType<typeof optimizeFavicon>>;

        switch (kind) {
          case "og":
            optimized = await optimizeOgImage(inputBuffer, contentType);
            break;

          case "logo":
            optimized = await optimizeLogo(inputBuffer, contentType);
            break;

          case "favicon": {
            const favicons = await generateFaviconSet(inputBuffer);

            const origName = file.name || "favicon";
            const safeBase = sanitizeFilename(origName.replace(/\.[^.]+$/, ""));

            const { y, m } = nowParts();
            const baseName = `${safeBase}-${Date.now()}`;

            const urls: Record<number, string> = {};

            for (const size of FAVICON_SIZES) {
              const filename = `${baseName}-${size}.png`;
              const absPath = join(UPLOADS_ROOT, y, m, filename);

              await ensureDirForFile(absPath);
              await writeFileAtomic(absPath, favicons[size].buffer);

              urls[size] = `/uploads/${y}/${m}/${filename}`;
            }

            // On retourne la 32px comme "primary"
            return {
              url: urls[32],
              filename: `${baseName}-32.png`,
              size: favicons[32].buffer.length,
              width: 32,
              height: 32,
              contentType: "image/png",
              originalSize: size,
              optimizedSize: favicons[32].buffer.length,
              wasResized: true,
              wasCompressed: true,
            };
          }

          default:
            optimized = await optimizeContentImage(inputBuffer, contentType);
            break;
        }

        const meta = await sharp(optimized.buffer).metadata();

        const width = Number(meta.width ?? 0);
        const height = Number(meta.height ?? 0);

        if (width <= 0 || height <= 0) {
          throwHttp(400, {
            code: EC.INVALID_ARGUMENT,
            message: EC.UPLOAD_IMAGE_DIMENSIONS_INVALID,
            details: { width, height, contentType },
          });
        }

        const originalSize = size;
        const optimizedSize = optimized.buffer.length;

        const wasCompressed = optimizedSize < originalSize;
        const wasResized =
          optimized.originalWidth !== optimized.finalWidth ||
          optimized.originalHeight !== optimized.finalHeight;

        const origName = file.name || "image";
        const safeBase = sanitizeFilename(origName.replace(/\.[^.]+$/, ""));

        const { y, m } = nowParts();
        const filename = `${safeBase}-${Date.now()}.${optimized.ext}`;

        const absPath = join(UPLOADS_ROOT, y, m, filename);

        await ensureDirForFile(absPath);
        await writeFileAtomic(absPath, optimized.buffer);

        const url = `/uploads/${y}/${m}/${filename}`;

        lg.debug("upload.ok", {
          kind,
          originalSize: size,
          optimizedSize: optimized.buffer.length,
          url,
        });

        const res: UploadImageResponse = {
          url,
          filename,
          size: optimized.buffer.length,
          width,
          height,
          contentType: optimized.mime,
          originalSize,
          optimizedSize,
          wasResized,
          wasCompressed,
        };

        return res;
      },
    );
  });
}
