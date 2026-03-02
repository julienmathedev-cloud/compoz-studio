/**
 * @file apps/studio/src/i18n/runtime-keys.ts
 * @layer i18n
 * @description
 * Registre des clés i18n **non détectables statiquement** (i18n Ally / scans)
 * car construites dynamiquement au runtime (template strings, concat, mapping).
 *
 * Objectif :
 * - Centraliser les clés “dynamiques” à vérifier via `scripts/check-i18n.ts`
 * - Éviter d’ajouter du code i18n “juste pour l’outil” dans les composants UI
 *
 * Règles :
 * - Ce fichier contient uniquement des **clés i18n** (strings).
 * - Pas de textes traduits.
 * - Pas de logique.
 */

export const I18N_RUNTIME_KEYS = {
  /**
   * MenuBadges.tsx
   * - t(`admin.menuBadges.kinds.${k}`)
   * - k ∈ ("group" | "external" | "internal")
   */
  menuBadges: {
    kinds: [
      "admin.menuBadges.kinds.group",
      "admin.menuBadges.kinds.external",
      "admin.menuBadges.kinds.internal",
    ] as const,
  },

  /**
   * Social kinds (admin)
   * Utilisés via mapping (Select options) et parfois i18n runtime.
   *
   * Note :
   * - si tu conserves `SOCIAL_KIND_LABEL_KEYS` comme SoT UI, tu peux soit :
   *   A) laisser cette liste ici (recommandé : plus de regex dans le script)
   *   B) supprimer cette liste et continuer à extraire via regex (moins robuste)
   */
  socialKinds: {
    labels: [
      "admin.social.kind.website",
      "admin.social.kind.email",
      "admin.social.kind.phone",
      "admin.social.kind.custom",
      "admin.social.kind.whatsapp",
      "admin.social.kind.github",
      "admin.social.kind.linkedin",
      "admin.social.kind.instagram",
      "admin.social.kind.x",
      "admin.social.kind.youtube",
      "admin.social.kind.tiktok",
      "admin.social.kind.facebook",
      "admin.social.kind.behance",
      "admin.social.kind.dribbble",
    ] as const,
  },

  /**
   * Tabs / Onglets (si tu génères les clés via template string)
   * Exemple :
   * - t(`admin.dashboard.tabs.${tabId}`)
   *
   * 👉 Ajoute ici les clés exactes quand tu confirmes la liste.
   */
  dashboardTabs: {
    labels: [
      "admin.dashboard.tabs.overview",
      "admin.dashboard.tabs.identity",
      "admin.dashboard.tabs.menu",
      "admin.dashboard.tabs.social",
      "admin.dashboard.tabs.header",
      "admin.dashboard.tabs.footer",
      "admin.dashboard.tabs.pages",
      "admin.dashboard.tabs.blocks",
      "admin.dashboard.tabs.seo",
    ] as const,
  },

  previewFrame: {
    devices: [
      "admin.previewFrame.devices.mobile",
      "admin.previewFrame.devices.tablet",
      "admin.previewFrame.devices.laptop",
      "admin.previewFrame.devices.desktop",
      "admin.previewFrame.devices.wqhd",
      "admin.previewFrame.devices.uhd",
    ] as const,
  },

  footerSection: {
    warnings: [
      "admin.footerSection.warnings.copyrightEmpty",
      "admin.footerSection.warnings.footerLooksEmpty",
    ] as const,
  },

  headerSection: {
    warnings: ["admin.headerSection.warnings.noBranding"] as const,
  },

  identitySection: {
    warnings: [
      "admin.identitySection.warnings.logoMissing",
      "admin.identitySection.warnings.faviconMissing",
      "admin.identitySection.warnings.logoAndFaviconMissing",
    ] as const,
  },

  legalMenuSection: {
    warnings: [
      "admin.legalMenuSection.warnings.legalMenuEmpty",
      "admin.legalMenuSection.warnings.dupLabelsTop",
      "admin.legalMenuSection.warnings.dupLinksTop",
      "admin.legalMenuSection.warnings.externalNoNewTab",
      "admin.legalMenuSection.warnings.externalPrefixOnly",
      "admin.legalMenuSection.warnings.internalHrefNotFound",
    ] as const,
  },

  pageEditSection: {
    warnings: [
      "admin.pageEditSection.warnings.slugNotNormalized",
      "admin.pageEditSection.warnings.titleLooksThin",
    ] as const,
  },

  primaryMenuSection: {
    warnings: [
      "admin.primaryMenuSection.warnings.primaryMenuEmpty",
      "admin.primaryMenuSection.warnings.dupLabelsTop",
      "admin.primaryMenuSection.warnings.dupLinksTop",
      "admin.primaryMenuSection.warnings.dupLabelsChildren",
      "admin.primaryMenuSection.warnings.dupLinksChildren",
      "admin.primaryMenuSection.warnings.externalNoNewTab",
      "admin.primaryMenuSection.warnings.externalPrefixOnly",
      "admin.primaryMenuSection.warnings.internalHrefNotFound",
    ] as const,
  },

  seoSection: {
    warnings: [
      "admin.seoSection.warnings.description.length",
      "admin.seoSection.warnings.titleTemplate.placeholderMissing",
      "admin.seoSection.warnings.robots.noindex",
      "admin.seoSection.warnings.openGraph.image.missing",
    ] as const,
  },

  socialSection: {
    warnings: [
      "admin.socialSection.warnings.socialEmpty",
      "admin.socialSection.warnings.dupLinks",
    ] as const,
  },

  cellEditorTabs: {
    kinds: [
      "admin.cellEditorTabs.kinds.richText",
      "admin.cellEditorTabs.kinds.image",
      "admin.cellEditorTabs.kinds.gallery",
      "admin.cellEditorTabs.kinds.carousel",
    ] as const,
  },

  imageCellEditor: {
    variants: [
      "admin.cellEditorTabs.imageCellEditor.variants.default",
      "admin.cellEditorTabs.imageCellEditor.variants.wide",
      "admin.cellEditorTabs.imageCellEditor.variants.portrait",
      "admin.cellEditorTabs.imageCellEditor.variants.square",
    ] as const,
  },
} as const;
