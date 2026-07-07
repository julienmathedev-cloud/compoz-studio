/**
 * @file apps/studio/src/app/api/media/upload/image/prepare/route.ts
 * @layer studio/app/api
 *
 * @description
 * Prepares a temporary image upload in Blob storage by generating a temp key
 * scoped by Website.id. That key is then used as the client upload pathname.
 *
 * @remarks
 * - Requires a valid Studio session.
 * - Temporary uploads are scoped by Prisma Website.id.
 * - The generated `tempKey` follows this convention:
 *   `websites/:websiteId/_tmp/media/:year/:month/:filename`
 */

import "server-only";

import { randomUUID } from "node:crypto";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { throwHttp } from "@compoz/http/http-error";
import type {
  PrepareImageUploadRequest,
  PrepareImageUploadResponse,
  UploadImageKind,
} from "@compoz/infra/http/studio/media.types";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";

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

function splitFilename(name: string): Readonly<{ base: string; ext: string }> {
  const match = /^(.*?)(\.[^.]+)?$/.exec(name.trim());

  const rawBase = match?.[1] ?? "image";
  const rawExt = match?.[2] ?? "";

  return {
    base: rawBase || "image",
    ext: rawExt.toLowerCase(),
  };
}

function buildTempStorageKey(args: {
  websiteId: string;
  year: string;
  month: string;
  filename: string;
}): string {
  return `websites/${args.websiteId}/_tmp/media/${args.year}/${args.month}/${args.filename}`;
}

export async function POST(req: Request) {
  const NS = "api.studio.media.upload.image.prepare.POST" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();
    const body = (await req.json()) as PrepareImageUploadRequest;

    const filename = readString(body, "filename").trim();
    const contentType = readString(body, "contentType").trim();
    const size = readNumber(body, "size");
    const kind = readString(body, "kind").trim();

    if (!filename) {
      throwHttp(400, {
        code: EC.INVALID_ARGUMENT,
        message: EC.UPLOAD_FILE_MISSING,
        details: { field: "filename" },
      });
    }

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

    const { base, ext } = splitFilename(filename);
    const safeBase = sanitizeFilename(base);
    const { year, month } = nowParts();

    const tempFilename = `${safeBase}-${randomUUID()}${ext}`;
    const tempKey = buildTempStorageKey({
      websiteId,
      year,
      month,
      filename: tempFilename,
    });

    const res: PrepareImageUploadResponse = {
      tempKey,
    };

    return res;
  });
}
