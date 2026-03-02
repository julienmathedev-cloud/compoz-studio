/**
 * @file apps/site/src/app/uploads/[...path]/route.ts
 * @layer app/public
 *
 * @description
 * Sert les fichiers d’uploads à runtime depuis le dossier configuré.
 *
 * @remarks
 * - Corrige les 404 sur /uploads/* après upload en prod (pnpm start).
 * - Protège contre la path traversal.
 */

import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";

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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;

  // ✅ empêche /uploads/../../secret
  const rel = normalize(path.join("/")).replace(/^(\.\.(\/|\\|$))+/, "");
  const abs = join(UPLOADS_ROOT, rel);

  try {
    const buf = await readFile(abs);
    const ext = (abs.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();

    return new Response(buf, {
      headers: {
        "content-type": contentTypeFromExt(ext),
        "cache-control": "no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
