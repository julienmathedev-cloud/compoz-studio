/**
 * @file packages/infra/src/http/studio/media.client.ts
 * @layer infra/http
 * @description
 * Client HTTP Admin pour l’upload de médias (multipart/form-data).
 */

import { ENDPOINTS } from "@compoz/infra/http/endpoints";
import { apiFetch } from "@compoz/infra/lib/api-fetch";
import { logSpan } from "@compoz/infra/lib/log";

import type {
  UploadImageKind,
  UploadImageResponse,
  UploadSvgResponse,
} from "@compoz/infra/http/studio/media.types";

function buildUploadFormData(file: File) {
  const fd = new FormData();
  fd.append("file", file, file.name);
  return fd;
}

export async function uploadImage(
  file: File,
  kind: UploadImageKind = "content",
  opts?: Omit<RequestInit, "method" | "body">,
): Promise<UploadImageResponse> {
  if (!(file instanceof File)) {
    throw new TypeError("uploadImage: argument 'file' must be a File.");
  }

  const fd = buildUploadFormData(file);
  const endpoint = `${ENDPOINTS.STUDIO.MEDIA.uploadImage}?kind=${kind}`;

  return logSpan(
    "infra.http.admin.media.uploadImage",
    {
      endpoint,
      method: "POST",
      fileSize: file.size,
      fileType: file.type || undefined,
      kind,
    },
    async () => {
      const res = await apiFetch<UploadImageResponse>(endpoint, {
        method: "POST",
        body: fd,
        ...(opts ?? {}),
      });

      if (!res) {
        throw new Error(
          "uploadImage: expected JSON response after upload, received null.",
        );
      }

      return res;
    },
  );
}

export async function uploadSvg(
  file: File,
  opts?: Omit<RequestInit, "method" | "body">,
): Promise<UploadSvgResponse> {
  if (!(file instanceof File)) {
    throw new TypeError("uploadSvg: argument 'file' must be a File.");
  }

  const fd = buildUploadFormData(file);

  return logSpan(
    "infra.http.admin.media.uploadSvg",
    {
      endpoint: ENDPOINTS.STUDIO.MEDIA.uploadSvg,
      method: "POST",
      fileSize: file.size,
      fileType: file.type || undefined,
    },
    async () => {
      const res = await apiFetch<UploadSvgResponse>(
        ENDPOINTS.STUDIO.MEDIA.uploadSvg,
        {
          method: "POST",
          body: fd,
          ...(opts ?? {}),
        },
      );

      if (!res) {
        throw new Error(
          "uploadSvg: expected JSON response after upload, received null.",
        );
      }

      return res;
    },
  );
}
