/**
 * @file packages/core/src/constants/icons/content-icons.ts
 * @layer core/constants
 * @description
 * Source de vérité métier pour les icônes de contenu.
 *
 * @remarks
 * - Utilisé par domain, validation, UI.
 * - Aucune dépendance React ici.
 */

export const CONTENT_ICON_KINDS = [
  "activity",
  "badge-alert",
  "badge-check",
  "bar-chart-3",
  "bell",
  "blocks",
  "book-open",
  "briefcase-business",
  "building-2",
  "calendar",
  "camera",
  "check-circle-2",
  "circle-dollar-sign",
  "circle-gauge",
  "clipboard-list",
  "clock",
  "cloud",
  "code-2",
  "component",
  "credit-card",
  "file-text",
  "folder-open",
  "globe",
  "graduation-cap",
  "hammer",
  "handshake",
  "heart",
  "image",
  "layout",
  "layers",
  "lightbulb",
  "lock",
  "mail",
  "map-pinned",
  "megaphone",
  "menu",
  "message-circle",
  "message-square",
  "monitor",
  "newspaper",
  "palette",
  "pen-tool",
  "phone",
  "puzzle",
  "rocket",
  "search",
  "settings",
  "shield-check",
  "shopping-bag",
  "sparkles",
  "star",
  "store",
  "target",
  "trending-up",
  "users",
  "wallet",
  "wrench",
  "zap",
] as const;

export type ContentIconKind = (typeof CONTENT_ICON_KINDS)[number];
