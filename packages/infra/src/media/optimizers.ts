/**
 * @file packages/infra/src/media/optimizers.ts
 * @layer infra/media
 * @description
 * Optimisation server-side des assets média via Sharp.
 *
 * Responsabilités :
 * - Optimisation images “content” (max width 1920)
 * - Optimisation OG image (1200x630 cover)
 * - Optimisation logo (SVG passthrough, sinon PNG/JPEG selon alpha)
 * - Optimisation favicon (ICO/SVG passthrough, sinon PNG 48x48)
 * - Génération d’un set de favicons PNG (plusieurs tailles)
 *
 * @remarks
 * - Server-only (Node) : utilise Buffer + sharp.
 * - Ne doit pas être importé côté client.
 */

import sharp from "sharp";

export type OptimizedAsset = Readonly<{
  buffer: Buffer;
  mime: string;
  ext: "jpg" | "png" | "svg" | "ico";
  originalWidth: number;
  originalHeight: number;
  finalWidth: number;
  finalHeight: number;
}>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function assertRaster(mime: string): void {
  if (!mime.startsWith("image/")) throw new Error("NOT_AN_IMAGE");
  if (mime === "image/svg+xml") throw new Error("SVG_NOT_RASTER");
}

async function getMeta(
  input: Buffer,
): Promise<Readonly<{ width: number; height: number }>> {
  const meta = await sharp(input).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}

async function hasAlpha(input: Buffer): Promise<boolean> {
  const meta = await sharp(input).metadata();
  return Boolean(meta.hasAlpha) || meta.channels === 4;
}

/* -------------------------------------------------------------------------- */
/* 1) Content images                                                          */
/* -------------------------------------------------------------------------- */

export async function optimizeContentImage(
  input: Buffer,
  inputMime: string,
): Promise<OptimizedAsset> {
  assertRaster(inputMime);

  const original = await getMeta(input);

  const buffer = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  const final = await getMeta(buffer);

  return {
    buffer,
    mime: "image/jpeg",
    ext: "jpg",
    originalWidth: original.width,
    originalHeight: original.height,
    finalWidth: final.width,
    finalHeight: final.height,
  };
}

/* -------------------------------------------------------------------------- */
/* 2) OpenGraph image                                                         */
/* -------------------------------------------------------------------------- */

export async function optimizeOgImage(
  input: Buffer,
  inputMime: string,
): Promise<OptimizedAsset> {
  assertRaster(inputMime);

  const original = await getMeta(input);

  const buffer = await sharp(input, { failOn: "none" })
    .rotate()
    .resize(1200, 630, { fit: "cover", position: "center" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  const final = await getMeta(buffer);

  return {
    buffer,
    mime: "image/jpeg",
    ext: "jpg",
    originalWidth: original.width,
    originalHeight: original.height,
    finalWidth: final.width,
    finalHeight: final.height,
  };
}

/* -------------------------------------------------------------------------- */
/* 3) Logo                                                                    */
/* -------------------------------------------------------------------------- */

export async function optimizeLogo(
  input: Buffer,
  inputMime: string,
): Promise<OptimizedAsset> {
  // SVG : on garde tel quel
  if (inputMime === "image/svg+xml") {
    return {
      buffer: input,
      mime: "image/svg+xml",
      ext: "svg",
      originalWidth: 0,
      originalHeight: 0,
      finalWidth: 0,
      finalHeight: 0,
    };
  }

  assertRaster(inputMime);

  const original = await getMeta(input);
  const alpha = await hasAlpha(input);

  let buffer: Buffer;
  let mime: string;
  let ext: "jpg" | "png";

  if (alpha) {
    buffer = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width: 512, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();
    mime = "image/png";
    ext = "png";
  } else {
    buffer = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width: 512, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    mime = "image/jpeg";
    ext = "jpg";
  }

  const final = await getMeta(buffer);

  return {
    buffer,
    mime,
    ext,
    originalWidth: original.width,
    originalHeight: original.height,
    finalWidth: final.width,
    finalHeight: final.height,
  };
}

/* -------------------------------------------------------------------------- */
/* 4) Favicon                                                                 */
/* -------------------------------------------------------------------------- */

export async function optimizeFavicon(
  input: Buffer,
  inputMime: string,
): Promise<OptimizedAsset> {
  if (
    inputMime === "image/x-icon" ||
    inputMime === "image/vnd.microsoft.icon"
  ) {
    return {
      buffer: input,
      mime: inputMime,
      ext: "ico",
      originalWidth: 0,
      originalHeight: 0,
      finalWidth: 0,
      finalHeight: 0,
    };
  }

  if (inputMime === "image/svg+xml") {
    return {
      buffer: input,
      mime: "image/svg+xml",
      ext: "svg",
      originalWidth: 0,
      originalHeight: 0,
      finalWidth: 0,
      finalHeight: 0,
    };
  }

  assertRaster(inputMime);

  const original = await getMeta(input);

  const buffer = await sharp(input, { failOn: "none" })
    .rotate()
    .resize(48, 48, { fit: "cover" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  const final = await getMeta(buffer);

  return {
    buffer,
    mime: "image/png",
    ext: "png",
    originalWidth: original.width,
    originalHeight: original.height,
    finalWidth: final.width,
    finalHeight: final.height,
  };
}

/* -------------------------------------------------------------------------- */
/* 5) Favicon Set (V0.5 production ready)                                     */
/* -------------------------------------------------------------------------- */

export const FAVICON_SIZES = [16, 32, 48, 180, 192, 512] as const;

export type FaviconSize = (typeof FAVICON_SIZES)[number];

export type FaviconSet = Record<
  FaviconSize,
  {
    buffer: Buffer;
    width: number;
    height: number;
  }
>;

export async function generateFaviconSet(input: Buffer): Promise<FaviconSet> {
  const results: Partial<FaviconSet> = {};

  for (const size of FAVICON_SIZES) {
    const buffer = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();

    results[size] = {
      buffer,
      width: size,
      height: size,
    };
  }

  return results as FaviconSet;
}
