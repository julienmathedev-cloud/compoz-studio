/**
 * @file apps/studio/src/lib/ui/uiError.ts
 * @layer studio/lib/ui
 * @description
 * Source of truth for Studio UI error tokens.
 *
 * @remarks
 * - Used by `notify` to display toast messages.
 * - Keys resolve through i18n under `uiErrors.<token>`.
 * - HTTP tokens are split between title and description variants.
 */

export const UiError = {
  errorGeneric: "errorGeneric",
  error: "error",
  networkError: "networkError",
  operationCancelled: "operationCancelled",
  requestAborted: "requestAborted",
  serverError: "serverError",
  unexpectedSave: "unexpectedSave",

  http400: "http400",
  http400Title: "http400Title",
  http401: "http401",
  http401Title: "http401Title",
  http403: "http403",
  http403Title: "http403Title",
  http404: "http404",
  http404Title: "http404Title",
  http405: "http405",
  http405Title: "http405Title",
  http409: "http409",
  http409Title: "http409Title",
  http422: "http422",
  http422Title: "http422Title",
  http500: "http500",
  http500Title: "http500Title",

  fileTooLarge: "fileTooLarge",
  notImage: "notImage",
  uploadFailed: "uploadFailed",
} as const;

export type UiErrorToken = (typeof UiError)[keyof typeof UiError];
