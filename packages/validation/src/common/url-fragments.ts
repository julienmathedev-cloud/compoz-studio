/**
 * @file packages/validation/src/common/url-fragments.ts
 * @layer validation/common
 * @description
 * Defines shared Zod schemas for accepted URL fragment shapes.
 *
 * @remarks
 * These schemas validate transport boundaries only; URL normalization and domain rules stay in core.
 */

import { URLS } from "@compoz/core/constants/limits/urls";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  isAbsoluteHttpProtocol,
  isRelativeUrlOrHashAnchor,
} from "@compoz/core/domain/urls/guards";
import { z } from "zod";

export const AbsoluteHttpUrlSchema = z
  .string()
  .trim()
  .refine((s) => s.length > 0, { message: ERROR_CODES.URL_REQUIRED })
  .refine((s) => !/\s/.test(s), { message: ERROR_CODES.URL_NO_SPACES })
  .refine((s) => !s.includes("\\"), { message: ERROR_CODES.URL_NO_BACKSLASH })
  .refine((s) => s.length <= URLS.MAX, { message: ERROR_CODES.URL_TOO_LONG })
  .refine(
    (s) => {
      try {
        const u = new URL(s);
        return isAbsoluteHttpProtocol(u.protocol) && !!u.hostname;
      } catch {
        return false;
      }
    },
    { message: ERROR_CODES.URL_ABSOLUTE_HTTP_REQUIRED },
  );

export const RelativeUrlSchema = z
  .string()
  .trim()
  .refine((s) => s.length > 0, { message: ERROR_CODES.URL_REQUIRED })
  .refine((s) => !/\s/.test(s), { message: ERROR_CODES.URL_NO_SPACES })
  .refine((s) => !s.includes("\\"), { message: ERROR_CODES.URL_NO_BACKSLASH })
  .refine((s) => s.length <= URLS.MAX, { message: ERROR_CODES.URL_TOO_LONG })
  .refine((s) => isRelativeUrlOrHashAnchor(s), {
    message: ERROR_CODES.URL_RELATIVE_REQUIRED,
  });

export const HashAnchorSchema = z
  .string()
  .trim()
  .refine((s) => s.length > 0, { message: ERROR_CODES.URL_REQUIRED })
  .refine((s) => !/\s/.test(s), { message: ERROR_CODES.URL_NO_SPACES })
  .refine((s) => !s.includes("\\"), { message: ERROR_CODES.URL_NO_BACKSLASH })
  .refine((s) => s.length <= URLS.MAX, { message: ERROR_CODES.URL_TOO_LONG })
  .refine((s) => /^#[A-Za-z0-9_-]+$/.test(s), {
    message: ERROR_CODES.URL_RELATIVE_REQUIRED,
  });

export const AssetUrlSchema = z.union([
  AbsoluteHttpUrlSchema,
  RelativeUrlSchema,
  HashAnchorSchema,
]);

export type AssetUrlInput = z.input<typeof AssetUrlSchema>;
