/**
 * @file packages/core/src/domain/errors/codes.ts
 * @layer core/domain
 * @description
 * Source de vérité des codes d’erreur métier (stables) utilisés par le domaine.
 * Ces codes peuvent être mappés vers HTTP, Zod et l’UI (messages conditionnels).
 *
 * Contrainte : codes en `MAJUSCULES_SNAKE_CASE`, stables dans le temps.
 */

export const ERROR_CODES = {
  /* ------------------------------------------------------------------------ */
  /*                                Généraux                                  */
  /* ------------------------------------------------------------------------ */

  UNKNOWN: "UNKNOWN", // fallback global si l’erreur n’est pas catégorisée
  INTERNAL: "INTERNAL", // erreur technique interne (mapped → HTTP 500)
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR", // après parsing / validation complexe

  /* ------------------------------------------------------------------------ */
  /*                           AuthN / AuthZ                                  */
  /* ------------------------------------------------------------------------ */

  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  /* ------------------------------------------------------------------------ */
  /*                         Arguments / Contrats                             */
  /* ------------------------------------------------------------------------ */

  INVALID_ARGUMENT: "INVALID_ARGUMENT", // mauvais input métier
  CONTENT_STATE_INVALID: "CONTENT_STATE_INVALID",
  JSON_INVALID: "JSON_INVALID",
  JSON_OBJECT_EXPECTED: "JSON_OBJECT_EXPECTED",

  /* ------------------------------------------------------------------------ */
  /*                              HTTP / Domain                               */
  /* ------------------------------------------------------------------------ */

  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  // Upload (messages précis)
  UPLOAD_FILE_MISSING: "UPLOAD_FILE_MISSING",
  UPLOAD_IMAGE_REQUIRED: "UPLOAD_IMAGE_REQUIRED",
  UPLOAD_MIME_NOT_ALLOWED: "UPLOAD_MIME_NOT_ALLOWED",
  UPLOAD_EMPTY_FILE: "UPLOAD_EMPTY_FILE",
  UPLOAD_IMAGE_DIMENSIONS_INVALID: "UPLOAD_IMAGE_DIMENSIONS_INVALID",
  UPLOAD_FILE_TOO_LARGE: "UPLOAD_FILE_TOO_LARGE",
  UPLOAD_SVG_NOT_SAFE: "UPLOAD_SVG_NOT_SAFE",
  // ⚠️ Messages techniques internes (assertions DEV, non exposables UI)
  HREF_RELATIVE_INVALID: "HREF_RELATIVE_INVALID",
  HREF_ABSOLUTE_HTTP_INVALID: "HREF_ABSOLUTE_HTTP_INVALID",
  HREF_MAILTO_INVALID: "HREF_MAILTO_INVALID",

  /* ------------------------------------------------------------------------ */
  /*                         Identité du site (Identity)                      */
  /* ------------------------------------------------------------------------ */

  IDENTITY_SITENAME_REQUIRED: "IDENTITY_SITENAME_REQUIRED",
  IDENTITY_LOGO_ALT_REQUIRED: "IDENTITY_LOGO_ALT_REQUIRED",
  IDENTITY_SITENAME_TOO_LONG: "IDENTITY_SITENAME_TOO_LONG",
  IDENTITY_TAGLINE_TOO_LONG: "IDENTITY_TAGLINE_TOO_LONG",
  IDENTITY_LOGO_ALT_TOO_LONG: "IDENTITY_LOGO_ALT_TOO_LONG",

  /* ------------------------------------------------------------------------ */
  /*                                  Footer                                  */
  /* ------------------------------------------------------------------------ */

  FOOTER_COPYRIGHT_TOO_LONG: "FOOTER_COPYRIGHT_TOO_LONG",

  /* ------------------------------------------------------------------------ */
  /*                                    SEO                                   */
  /* ------------------------------------------------------------------------ */

  SEO_TITLE_REQUIRED: "SEO_TITLE_REQUIRED",
  SEO_TITLE_TEMPLATE_MISSING_PLACEHOLDER:
    "SEO_TITLE_TEMPLATE_MISSING_PLACEHOLDER",
  SEO_BASEURL_INVALID: "SEO_BASEURL_INVALID",
  SEO_CANONICAL_URL_INVALID: "SEO_CANONICAL_URL_INVALID",
  SEO_BASEURL_REQUIRED: "SEO_BASEURL_REQUIRED",
  SEO_BASEURL_HTTPS_REQUIRED: "SEO_BASEURL_HTTPS_REQUIRED",
  SEO_ASSET_URL_INVALID: "SEO_ASSET_URL_INVALID",
  SEO_TWITTER_HANDLE_INVALID: "SEO_TWITTER_HANDLE_INVALID",
  SEO_DEFAULT_DESCRIPTION_TOO_SHORT: "SEO_DEFAULT_DESCRIPTION_TOO_SHORT",
  SEO_TITLE_TEMPLATE_TOO_SHORT: "SEO_TITLE_TEMPLATE_TOO_SHORT",
  SEO_ROBOTS_TOO_LONG: "SEO_ROBOTS_TOO_LONG",
  SEO_OPEN_GRAPH_TITLE_TOO_LONG: "SEO_OPEN_GRAPH_TITLE_TOO_LONG",
  SEO_OPEN_GRAPH_DESCRIPTION_TOO_LONG: "SEO_OPEN_GRAPH_DESCRIPTION_TOO_LONG",
  SEO_OPEN_GRAPH_IMAGE_ALT_TOO_LONG: "SEO_OPEN_GRAPH_IMAGE_ALT_TOO_LONG",
  SEO_TITLE_TOO_LONG: "SEO_TITLE_TOO_LONG",
  SEO_DESCRIPTION_TOO_LONG: "SEO_DESCRIPTION_TOO_LONG",
  SEO_TITLE_TEMPLATE_TOO_LONG: "SEO_TITLE_TEMPLATE_TOO_LONG",

  /* ------------------------------------------------------------------------ */
  /*                                   Social                                 */
  /* ------------------------------------------------------------------------ */

  SOCIAL_DUPLICATE_KIND: "SOCIAL_DUPLICATE_KIND",
  SOCIAL_INVALID_FOR_PLATFORM: "SOCIAL_INVALID_FOR_PLATFORM",
  SOCIAL_ABSOLUTE_REQUIRED: "SOCIAL_ABSOLUTE_REQUIRED",
  SOCIAL_HREF_REQUIRED: "SOCIAL_HREF_REQUIRED",
  SOCIAL_TOO_MANY_ITEMS: "SOCIAL_TOO_MANY_ITEMS",
  SOCIAL_MAILTO_INVALID: "SOCIAL_MAILTO_INVALID",
  SOCIAL_EMAIL_REQUIRES_MAILTO: "SOCIAL_EMAIL_REQUIRES_MAILTO",
  SOCIAL_MAILTO_RESERVED_FOR_EMAIL: "SOCIAL_MAILTO_RESERVED_FOR_EMAIL",

  /* ------------------------------------------------------------------------ */
  /*                                Primary menu                              */
  /* ------------------------------------------------------------------------ */

  PRIMARY_MENU_LABEL_TOO_LONG: "PRIMARY_MENU_LABEL_TOO_LONG",
  PRIMARY_MENU_LABEL_REQUIRED: "PRIMARY_MENU_LABEL_REQUIRED",
  PRIMARY_MENU_HREF_REQUIRED: "PRIMARY_MENU_HREF_REQUIRED",
  PRIMARY_MENU_HREF_INVALID: "PRIMARY_MENU_HREF_INVALID",
  PRIMARY_MENU_TOO_MANY_ITEMS: "PRIMARY_MENU_TOO_MANY_ITEMS",
  PRIMARY_MENU_PARENT_WITH_CHILDREN_NEWTAB_FORBIDDEN:
    "PRIMARY_MENU_PARENT_WITH_CHILDREN_NEWTAB_FORBIDDEN",

  /* ------------------------------------------------------------------------ */
  /*                                  Legal menu                              */
  /* ------------------------------------------------------------------------ */

  LEGAL_MENU_LABEL_TOO_LONG: "LEGAL_MENU_LABEL_TOO_LONG",
  LEGAL_MENU_LABEL_REQUIRED: "LEGAL_MENU_LABEL_REQUIRED",
  LEGAL_MENU_HREF_REQUIRED: "LEGAL_MENU_HREF_REQUIRED",
  LEGAL_MENU_HREF_INVALID: "LEGAL_MENU_HREF_INVALID",
  LEGAL_MENU_TOO_MANY_ITEMS: "LEGAL_MENU_TOO_MANY_ITEMS",

  /* ------------------------------------------------------------------------ */
  /*                                    Slug                                  */
  /* ------------------------------------------------------------------------ */

  SLUG_REQUIRED: "SLUG_REQUIRED",
  SLUG_INVALID_FORMAT: "SLUG_INVALID_FORMAT",
  SLUG_RESERVED: "SLUG_RESERVED",
  SLUG_NORMALIZED_DIFFERENT: "SLUG_NORMALIZED_DIFFERENT",
  SLUG_RESERVED_HINT: "SLUG_RESERVED_HINT",

  /* ------------------------------------------------------------------------ */
  /*                                Publication                               */
  /* ------------------------------------------------------------------------ */

  PUBLISH_IDENTICAL_STATES: "PUBLISH_IDENTICAL_STATES",
  PUBLISH_EMPTY_INDEX: "PUBLISH_EMPTY_INDEX",
  PUBLISH_SETTINGS_COPY_FAILED: "PUBLISH_SETTINGS_COPY_FAILED",
  PUBLISH_PAGE_MISSING: "PUBLISH_PAGE_MISSING",
  PUBLISH_PAGE_DELETE_FAILED: "PUBLISH_PAGE_DELETE_FAILED",

  // Warnings “site live” (V0.5)
  PUBLISH_HOME_MISSING: "PUBLISH_HOME_MISSING",
  PUBLISH_PRIMARY_MENU_EMPTY: "PUBLISH_PRIMARY_MENU_EMPTY",
  PUBLISH_LEGAL_MENU_EMPTY: "PUBLISH_LEGAL_MENU_EMPTY",
  PUBLISH_SOCIAL_EMPTY: "PUBLISH_SOCIAL_EMPTY",
  PUBLISH_IDENTITY_LOGO_MISSING: "PUBLISH_IDENTITY_LOGO_MISSING",
  PUBLISH_IDENTITY_FAVICON_MISSING: "PUBLISH_IDENTITY_FAVICON_MISSING",
  PUBLISH_SEO_OG_IMAGE_MISSING: "PUBLISH_SEO_OG_IMAGE_MISSING",
  PUBLISH_SEO_ROBOTS_NOINDEX: "PUBLISH_SEO_ROBOTS_NOINDEX",
  PUBLISH_SEO_BASEURL_MISSING: "PUBLISH_SEO_BASEURL_MISSING",

  /* ------------------------------------------------------------------------ */
  /*                              SiteIndex                                   */
  /* ------------------------------------------------------------------------ */

  SITE_INDEX_DUPLICATE_SLUGS: "SITE_INDEX_DUPLICATE_SLUGS",
  SITE_INDEX_NOT_FOUND: "SITE_INDEX_NOT_FOUND",

  /* ------------------------------------------------------------------------ */
  /*                                  Pages                                   */
  /* ------------------------------------------------------------------------ */

  PAGE_TITLE_REQUIRED: "PAGE_TITLE_REQUIRED",
  PAGE_SLUG_REQUIRED: "PAGE_SLUG_REQUIRED",
  PAGE_SLUG_INVALID_FORMAT: "PAGE_SLUG_INVALID_FORMAT",
  PAGE_SLUG_RESERVED: "PAGE_SLUG_RESERVED",
  PAGE_NOT_FOUND: "PAGE_NOT_FOUND",
  PAGE_SLUG_CONFLICT: "PAGE_SLUG_CONFLICT",
  PAGE_TITLE_TOO_SHORT: "PAGE_TITLE_TOO_SHORT",
  PAGE_TITLE_TOO_LONG: "PAGE_TITLE_TOO_LONG",
  PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE: "PAGE_SITEMAP_PRIORITY_OUT_OF_RANGE",
  PAGE_ID_REQUIRED: "PAGE_ID_REQUIRED",

  /* ------------------------------------------------------------------------ */
  /*                                  Blocks                                  */
  /* ------------------------------------------------------------------------ */

  BLOCKS_INVALID: "BLOCKS_INVALID",
  BLOCK_ID_REQUIRED: "BLOCK_ID_REQUIRED",
  BLOCK_ID_DUPLICATE: "BLOCK_ID_DUPLICATE",
  BLOCKS_MULTIPLE_LCP_DETECTED: "BLOCKS_MULTIPLE_LCP_DETECTED",
  BLOCK_TYPE_UNSUPPORTED: "BLOCK_TYPE_UNSUPPORTED",
  BLOCK_NOT_FOUND: "BLOCK_NOT_FOUND",
  BLOCK_ID_MISMATCH: "BLOCK_ID_MISMATCH",

  LAYOUT_SECTION_COLUMNS_INVALID: "LAYOUT_SECTION_COLUMNS_INVALID",
  LAYOUT_SECTION_CELLS_INVALID: "LAYOUT_SECTION_CELLS_INVALID",
  LAYOUT_SECTION_CELLS_COUNT_MISMATCH: "LAYOUT_SECTION_CELLS_COUNT_MISMATCH",
  LAYOUT_SECTION_TITLE_REQUIRED: "LAYOUT_SECTION_TITLE_REQUIRED",
  LAYOUT_SECTION_TITLE_DISPLAY_INVALID: "LAYOUT_SECTION_TITLE_DISPLAY_INVALID",
  LAYOUT_SECTION_CONTAINER_MODE_INVALID:
    "LAYOUT_SECTION_CONTAINER_MODE_INVALID",

  CELL_INVALID: "CELL_INVALID",
  CELL_KIND_UNSUPPORTED: "CELL_KIND_UNSUPPORTED",

  RICH_TEXT_CONTENT_INVALID: "RICH_TEXT_CONTENT_INVALID",

  IMAGE_SRC_REQUIRED: "IMAGE_SRC_REQUIRED",
  IMAGE_ALT_INVALID: "IMAGE_ALT_INVALID",
  IMAGE_VARIANT_INVALID: "IMAGE_VARIANT_INVALID",

  GALLERY_MAX_COLUMNS_INVALID: "GALLERY_MAX_COLUMNS_INVALID",

  CELL_IMAGES_INVALID: "CELL_IMAGES_INVALID",
  CELL_IMAGES_MIN_1: "CELL_IMAGES_MIN_1",
  CELL_IMAGE_INVALID: "CELL_IMAGE_INVALID",
  CELL_IMAGE_SRC_REQUIRED: "CELL_IMAGE_SRC_REQUIRED",
  CELL_IMAGE_WIDTH_REQUIRED: "CELL_IMAGE_WIDTH_REQUIRED",
  CELL_IMAGE_HEIGHT_REQUIRED: "CELL_IMAGE_HEIGHT_REQUIRED",
  CELL_IMAGE_ALT_INVALID: "CELL_IMAGE_ALT_INVALID",
  CELL_IMAGE_CAPTION_INVALID: "CELL_IMAGE_CAPTION_INVALID",
  CELL_IMAGE_ID_REQUIRED: "CELL_IMAGE_ID_REQUIRED",
  CELL_IMAGE_HREF_INVALID: "CELL_IMAGE_HREF_INVALID",

  /* ------------------------------------------------------------------------ */
  /*                                   URLs                                   */
  /* ------------------------------------------------------------------------ */

  URL_REQUIRED: "URL_REQUIRED",
  URL_NO_SPACES: "URL_NO_SPACES",
  URL_NO_BACKSLASH: "URL_NO_BACKSLASH",
  URL_TOO_LONG: "URL_TOO_LONG",
  URL_ABSOLUTE_HTTP_REQUIRED: "URL_ABSOLUTE_HTTP_REQUIRED",
  URL_RELATIVE_REQUIRED: "URL_RELATIVE_REQUIRED",

  /* ------------------------------------------------------------------------ */
  /*                                   USERS                                   */
  /* ------------------------------------------------------------------------ */

  USER_ID_REQUIRED: "USER_ID_REQUIRED",
  USER_EMAIL_REQUIRED: "USER_EMAIL_REQUIRED",
  USER_EMAIL_INVALID_FORMAT: "USER_EMAIL_INVALID_FORMAT",
  USER_NAME_REQUIRED: "USER_NAME_REQUIRED",
  USER_ROLE_REQUIRED: "USER_ROLE_REQUIRED",
  USER_ROLE_INVALID: "USER_ROLE_INVALID",
  USER_TENANT_IDS_INVALID: "USER_TENANT_IDS_INVALID",
  USER_DEFAULT_TENANT_REQUIRED: "USER_DEFAULT_TENANT_REQUIRED",
  USER_DEFAULT_TENANT_NOT_ALLOWED: "USER_DEFAULT_TENANT_NOT_ALLOWED",
  USER_RBAC_INVALID: "USER_RBAC_INVALID",
  USER_STATUS_INVALID: "USER_STATUS_INVALID",
  USER_TENANT_IDS_REQUIRED: "USER_TENANT_IDS_REQUIRED",

  USER_PASSWORD_REQUIRED: "USER_PASSWORD_REQUIRED",
  USER_EMAIL_CONFLICT: "USER_EMAIL_CONFLICT",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_STATUS_REQUIRED: "USER_STATUS_REQUIRED",
} as const;

/**
 * Union littérale de tous les codes possibles.
 * Exemple : "NOT_FOUND" | "SEO_TITLE_REQUIRED" | ...
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Garde de type permettant de vérifier si une valeur inconnue
 * correspond à un code d’erreur métier valide.
 *
 * Utile dans :
 * - les adapters HTTP,
 * - les parseurs JSON,
 * - les helpers UI (affichage conditionnel d’erreurs).
 */
export function isErrorCode(v: unknown): v is ErrorCode {
  return (
    typeof v === "string" &&
    (Object.values(ERROR_CODES) as readonly string[]).includes(v)
  );
}
