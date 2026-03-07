/**
 * @file apps/site/src/app/uploads/[...path]/route.ts
 * @layer site/app
 *
 * @description
 * Sert les fichiers d’uploads à runtime depuis le dossier configuré.
 *
 * @remarks
 * - Corrige les 404 sur /uploads/* après upload en prod (pnpm start).
 * - Protège contre la path traversal (résolution + check root).
 */

import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

import { unwrapParams } from "@compoz/site/lib/unwrap-params";

const UPLOADS_ROOT =
  process.env["PUBLIC_UPLOADS_DIR"] ?? join(process.cwd(), "public", "uploads");

function contentTypeFromExt(ext: string): string {
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".ico":
      return "image/x-icon";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

type RouteParams = Readonly<{ path: string[] }>;

function safeRelativePath(segments: ReadonlyArray<string>): string {
  // Nettoie les segments (empêche ".", "..", et slashes/backslashes injectés).
  const safe = segments
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .map((s) => s.replace(/[\\/]+/g, "")) // retire tout slash/backslash
    .filter((s) => s !== "." && s !== "..");

  return safe.join("/");
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<RouteParams> },
) {
  const { path } = await unwrapParams(ctx.params);

  const rel = safeRelativePath(path);
  const root = resolve(UPLOADS_ROOT);
  const abs = resolve(root, rel);

  // ✅ empêche /uploads/../../secret (ou variantes)
  if (!abs.startsWith(root + sep) && abs !== root) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buf = await readFile(abs);
    const ext = (abs.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();

    // ⚠️ SVG : on évite un rendu inline (vecteur XSS), on force attachment.
    const isSvg = ext === ".svg";
    const disposition = isSvg ? "attachment" : "inline";

    return new Response(buf, {
      headers: {
        "content-type": contentTypeFromExt(ext),
        "x-content-type-options": "nosniff",
        "content-disposition": `${disposition}; filename="file${ext || ""}"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
