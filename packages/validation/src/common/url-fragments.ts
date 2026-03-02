/**
 * @file packages/validation/src/common/url-fragments.ts
 * @layer schemas
 * @description
 * Définit les schémas Zod décrivant la forme frontière de fragments d’URL.
 * Ces schémas valident uniquement la structure des chaînes (URL absolues ou relatives) ;
 * toute normalisation ou logique métier est traitée en amont dans le domaine.
 */

import { URLS } from "@compoz/core/constants/limits/urls";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import {
  isAbsoluteHttpProtocol,
  isRelativeUrl,
} from "@compoz/core/domain/urls/guards";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                         URL absolue (HTTP / HTTPS)                         */
/* -------------------------------------------------------------------------- */

/**
 * URL absolue HTTP(S) valide (forme frontière).
 */
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

/* -------------------------------------------------------------------------- */
/*                             URL relative stricte                           */
/* -------------------------------------------------------------------------- */

/**
 * URL relative valide commençant par "/" (forme frontière).
 */
export const RelativeUrlSchema = z
  .string()
  .trim()
  .refine((s) => s.length > 0, { message: ERROR_CODES.URL_REQUIRED })
  .refine((s) => !/\s/.test(s), { message: ERROR_CODES.URL_NO_SPACES })
  .refine((s) => !s.includes("\\"), { message: ERROR_CODES.URL_NO_BACKSLASH })
  .refine((s) => s.length <= URLS.MAX, { message: ERROR_CODES.URL_TOO_LONG })
  .refine((s) => isRelativeUrl(s), {
    message: ERROR_CODES.URL_RELATIVE_REQUIRED,
  });

/* -------------------------------------------------------------------------- */
/*                         Union : asset URL (abs/rel)                        */
/* -------------------------------------------------------------------------- */

/**
 * URL d’asset acceptée (absolue HTTP(S) ou relative).
 */
export const AssetUrlSchema = z.union([
  AbsoluteHttpUrlSchema,
  RelativeUrlSchema,
]);

/**
 * Entrée JSON acceptée par `AssetUrlSchema` (toujours string).
 */
export type AssetUrlInput = z.input<typeof AssetUrlSchema>;
