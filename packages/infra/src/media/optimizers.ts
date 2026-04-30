/**
 * @file packages/infra/src/media/optimizers.ts
 * @layer infra/media
 * @description
 * Optimisation server-side des assets média via Sharp.
 *
 * Responsabilités :
 * - Compression intelligente uniquement si nécessaire
 * - Préserve les assets déjà optimisés (PNG / WEBP / JPEG légers)
 * - Évite la dégradation des screenshots / logos / UI
 */

import "server-only";

import sharp from "sharp";

export type OptimizedAsset = Readonly<{
  buffer: Buffer;
  mime: string;
  ext: "jpg" | "png" | "webp" | "svg" | "ico";
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

async function getMetaAndAlpha(
  input: Buffer,
): Promise<Readonly<{ width: number; height: number; hasAlpha: boolean }>> {
  const meta = await sharp(input).metadata();

  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    hasAlpha: Boolean(meta.hasAlpha) || meta.channels === 4,
  };
}

function makeOptimizedAsset(args: {
  buffer: Buffer;
  mime: OptimizedAsset["mime"];
  ext: OptimizedAsset["ext"];
  original: Readonly<{ width: number; height: number }>;
  final: Readonly<{ width: number; height: number }>;
}): OptimizedAsset {
  return {
    buffer: args.buffer,
    mime: args.mime,
    ext: args.ext,
    originalWidth: args.original.width,
    originalHeight: args.original.height,
    finalWidth: args.final.width,
    finalHeight: args.final.height,
  };
}

function getRasterExt(inputMime: string): "jpg" | "png" | "webp" | null {
  if (inputMime === "image/jpeg") return "jpg";
  if (inputMime === "image/png") return "png";
  if (inputMime === "image/webp") return "webp";

  return null;
}

function passthroughRaster(args: {
  input: Buffer;
  inputMime: string;
  original: Readonly<{ width: number; height: number }>;
}): OptimizedAsset | null {
  const ext = getRasterExt(args.inputMime);

  if (!ext) return null;

  return makeOptimizedAsset({
    buffer: args.input,
    mime: args.inputMime as OptimizedAsset["mime"],
    ext,
    original: args.original,
    final: args.original,
  });
}

function isReasonableUpload(args: {
  input: Buffer;
  meta: Readonly<{ width: number; height: number }>;
  maxBytes: number;
  maxWidth: number;
}): boolean {
  return args.input.length <= args.maxBytes && args.meta.width <= args.maxWidth;
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

  const passthrough = passthroughRaster({
    input,
    inputMime,
    original,
  });

  if (
    passthrough &&
    isReasonableUpload({
      input,
      meta: original,
      maxBytes: 1_500_000,
      maxWidth: 1920,
    })
  ) {
    return passthrough;
  }

  const buffer = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  const final = await getMeta(buffer);

  return makeOptimizedAsset({
    buffer,
    mime: "image/jpeg",
    ext: "jpg",
    original,
    final,
  });
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
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  const final = await getMeta(buffer);

  return makeOptimizedAsset({
    buffer,
    mime: "image/jpeg",
    ext: "jpg",
    original,
    final,
  });
}

/* -------------------------------------------------------------------------- */
/* 3) Logo                                                                    */
/* -------------------------------------------------------------------------- */

export async function optimizeLogo(
  input: Buffer,
  inputMime: string,
): Promise<OptimizedAsset> {
  if (inputMime === "image/svg+xml") {
    return makeOptimizedAsset({
      buffer: input,
      mime: "image/svg+xml",
      ext: "svg",
      original: { width: 0, height: 0 },
      final: { width: 0, height: 0 },
    });
  }

  assertRaster(inputMime);

  const originalMeta = await getMetaAndAlpha(input);

  const original = {
    width: originalMeta.width,
    height: originalMeta.height,
  };

  const passthrough = passthroughRaster({
    input,
    inputMime,
    original,
  });

  if (
    passthrough &&
    isReasonableUpload({
      input,
      meta: original,
      maxBytes: 500_000,
      maxWidth: 1024,
    })
  ) {
    return passthrough;
  }

  let buffer: Buffer;
  let mime: string;
  let ext: "jpg" | "png";

  if (originalMeta.hasAlpha) {
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

  return makeOptimizedAsset({
    buffer,
    mime,
    ext,
    original,
    final,
  });
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
    return makeOptimizedAsset({
      buffer: input,
      mime: inputMime,
      ext: "ico",
      original: { width: 0, height: 0 },
      final: { width: 0, height: 0 },
    });
  }

  if (inputMime === "image/svg+xml") {
    return makeOptimizedAsset({
      buffer: input,
      mime: "image/svg+xml",
      ext: "svg",
      original: { width: 0, height: 0 },
      final: { width: 0, height: 0 },
    });
  }

  assertRaster(inputMime);

  const original = await getMeta(input);

  const buffer = await sharp(input, { failOn: "none" })
    .rotate()
    .resize(48, 48, { fit: "cover" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  const final = await getMeta(buffer);

  return makeOptimizedAsset({
    buffer,
    mime: "image/png",
    ext: "png",
    original,
    final,
  });
}

/* -------------------------------------------------------------------------- */
/* 5) Favicon Set                                                             */
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
