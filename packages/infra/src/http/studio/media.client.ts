/**
 * @file packages/infra/src/http/studio/media.client.ts
 * @layer infra/http/studio
 * @description
 * Client HTTP Studio pour l’upload de médias.
 *
 * @remarks
 * - Orchestration raster :
 *   1. prepare (tempKey serveur)
 *   2. client upload direct vers Blob
 *   3. finalize (Sharp + write final + cleanup temp)
 * - Conserve le contrat public `uploadImage(file, kind)` pour ne pas casser la UI.
 * - Le SVG garde temporairement le flux multipart existant tant que son pipeline
 *   dédié n’est pas migré.
 */

import { upload } from "@vercel/blob/client";

import { ENDPOINTS } from "@compoz/infra/http/endpoints";
import { apiFetch } from "@compoz/infra/lib/api-fetch";
import { logSpan } from "@compoz/infra/lib/log";

import type {
  FinalizeImageUploadRequest,
  PrepareImageUploadRequest,
  PrepareImageUploadResponse,
  UploadImageClientPayload,
  UploadImageKind,
  UploadImageResponse,
  UploadSvgResponse,
} from "@compoz/infra/http/studio/media.types";

type UploadRequestOpts = Omit<RequestInit, "method" | "body">;

function buildUploadFormData(file: File): FormData {
  const fd = new FormData();
  fd.append("file", file, file.name);
  return fd;
}

function assertFile(file: File, caller: string): void {
  if (!(file instanceof File)) {
    throw new TypeError(`${caller}: argument 'file' must be a File.`);
  }
}

export async function prepareImageUpload(
  file: File,
  kind: UploadImageKind = "content",
  opts?: UploadRequestOpts,
): Promise<PrepareImageUploadResponse> {
  assertFile(file, "prepareImageUpload");

  const endpoint = ENDPOINTS.STUDIO.MEDIA.image.prepare;
  const body: PrepareImageUploadRequest = {
    filename: file.name,
    contentType: file.type,
    size: file.size,
    kind,
  };

  return logSpan(
    "compoz:studio:svc:media-upload:prepare",
    {
      endpoint,
      method: "POST",
      fileSize: file.size,
      fileType: file.type || undefined,
      kind,
    },
    async () => {
      const res = await apiFetch<PrepareImageUploadResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
        ...(opts ?? {}),
      });

      if (!res) {
        throw new Error(
          "prepareImageUpload: expected JSON response, received null.",
        );
      }

      return res;
    },
  );
}

export async function finalizeImageUpload(
  file: File,
  prepared: PrepareImageUploadResponse,
  kind: UploadImageKind = "content",
  opts?: UploadRequestOpts,
): Promise<UploadImageResponse> {
  assertFile(file, "finalizeImageUpload");

  const endpoint = ENDPOINTS.STUDIO.MEDIA.image.finalize;
  const body: FinalizeImageUploadRequest = {
    tempKey: prepared.tempKey,
    kind,
    originalFilename: file.name,
    originalContentType: file.type,
    originalSize: file.size,
  };

  return logSpan(
    "compoz:studio:svc:media-upload:finalize",
    {
      endpoint,
      method: "POST",
      fileSize: file.size,
      fileType: file.type || undefined,
      kind,
      tempKey: prepared.tempKey,
    },
    async () => {
      const res = await apiFetch<UploadImageResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
        ...(opts ?? {}),
      });

      if (!res) {
        throw new Error(
          "finalizeImageUpload: expected JSON response, received null.",
        );
      }

      return res;
    },
  );
}

async function uploadImageToBlob(args: {
  file: File;
  prepared: PrepareImageUploadResponse;
  kind: UploadImageKind;
}): Promise<void> {
  const { file, prepared, kind } = args;

  const clientPayload: UploadImageClientPayload = {
    tempKey: prepared.tempKey,
    kind,
    originalFilename: file.name,
    originalContentType: file.type,
    originalSize: file.size,
  };

  await upload(prepared.tempKey, file, {
    access: "public",
    contentType: file.type || undefined,
    handleUploadUrl: ENDPOINTS.STUDIO.MEDIA.image.client,
    clientPayload: JSON.stringify(clientPayload),
    multipart: file.size > 4_500_000,
  });
}

export async function uploadImage(
  file: File,
  kind: UploadImageKind = "content",
  opts?: UploadRequestOpts,
): Promise<UploadImageResponse> {
  assertFile(file, "uploadImage");

  return logSpan(
    "compoz:studio:svc:media-upload",
    {
      method: "POST",
      fileSize: file.size,
      fileType: file.type || undefined,
      kind,
    },
    async () => {
      const prepared = await prepareImageUpload(file, kind, opts);

      await uploadImageToBlob({
        file,
        prepared,
        kind,
      });

      return finalizeImageUpload(file, prepared, kind, opts);
    },
  );
}

export async function uploadSvg(
  file: File,
  opts?: UploadRequestOpts,
): Promise<UploadSvgResponse> {
  assertFile(file, "uploadSvg");

  const fd = buildUploadFormData(file);
  const endpoint = ENDPOINTS.STUDIO.MEDIA.svg.base;

  return logSpan(
    "compoz:studio:svc:media-upload",
    {
      endpoint,
      method: "POST",
      fileSize: file.size,
      fileType: file.type || undefined,
    },
    async () => {
      const res = await apiFetch<UploadSvgResponse>(endpoint, {
        method: "POST",
        body: fd,
        ...(opts ?? {}),
      });

      if (!res) {
        throw new Error(
          "uploadSvg: expected JSON response after upload, received null.",
        );
      }

      return res;
    },
  );
}
