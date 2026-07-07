/**
 * @file apps/studio/src/i18n/runtime-keys.ts
 * @layer studio/i18n
 *
 * @description
 * Registry of i18n keys built dynamically at runtime and missed by static scans.
 *
 * @remarks
 * - Consumed by `scripts/check-i18n.ts` to validate that every listed key exists.
 * - Contains only i18n keys, with no translated copy or runtime logic.
 */

export const I18N_RUNTIME_KEYS = {
  /** Covers `t(`studio.menuBadges.kinds.${k}`)` for every supported badge kind. */
  menuBadges: {
    kinds: [
      "studio.menuBadges.kinds.group",
      "studio.menuBadges.kinds.external",
      "studio.menuBadges.kinds.internal",
    ] as const,
  },

  /** Mirrors social kind label keys when mappings build translation keys outside static scanner reach. */
  socialKinds: {
    labels: [
      "studio.social.kind.website",
      "studio.social.kind.email",
      "studio.social.kind.phone",
      "studio.social.kind.custom",
      "studio.social.kind.whatsapp",
      "studio.social.kind.github",
      "studio.social.kind.linkedin",
      "studio.social.kind.instagram",
      "studio.social.kind.x",
      "studio.social.kind.youtube",
      "studio.social.kind.tiktok",
      "studio.social.kind.facebook",
      "studio.social.kind.behance",
      "studio.social.kind.dribbble",
    ] as const,
  },

  /** Covers dashboard tab labels when tab ids are interpolated into translation keys. */
  dashboardTabs: {
    labels: [
      "studio.dashboard.tabs.overview",
      "studio.dashboard.tabs.identity",
      "studio.dashboard.tabs.menu",
      "studio.dashboard.tabs.social",
      "studio.dashboard.tabs.header",
      "studio.dashboard.tabs.footer",
      "studio.dashboard.tabs.pages",
      "studio.dashboard.tabs.blocks",
      "studio.dashboard.tabs.seo",
    ] as const,
  },

  previewFrame: {
    devices: [
      "studio.previewFrame.devices.mobile",
      "studio.previewFrame.devices.tablet",
      "studio.previewFrame.devices.laptop",
      "studio.previewFrame.devices.desktop",
      "studio.previewFrame.devices.wqhd",
      "studio.previewFrame.devices.uhd",
    ] as const,
  },

  footerSection: {
    warnings: [
      "studio.footerSection.warnings.copyrightEmpty",
      "studio.footerSection.warnings.footerLooksEmpty",
    ] as const,
  },

  headerSection: {
    warnings: ["studio.headerSection.warnings.noBranding"] as const,
  },

  identitySection: {
    warnings: [
      "studio.identitySection.warnings.logoMissing",
      "studio.identitySection.warnings.faviconMissing",
      "studio.identitySection.warnings.logoAndFaviconMissing",
    ] as const,
  },

  legalMenuSection: {
    warnings: [
      "studio.legalMenuSection.warnings.legalMenuEmpty",
      "studio.legalMenuSection.warnings.dupLabelsTop",
      "studio.legalMenuSection.warnings.dupLinksTop",
      "studio.legalMenuSection.warnings.externalNoNewTab",
      "studio.legalMenuSection.warnings.externalPrefixOnly",
      "studio.legalMenuSection.warnings.internalHrefNotFound",
    ] as const,
  },

  pageEditSection: {
    warnings: [
      "studio.pageEditSection.warnings.slugNotNormalized",
      "studio.pageEditSection.warnings.titleLooksThin",
    ] as const,
  },

  primaryMenuSection: {
    warnings: [
      "studio.primaryMenuSection.warnings.primaryMenuEmpty",
      "studio.primaryMenuSection.warnings.dupLabelsTop",
      "studio.primaryMenuSection.warnings.dupLinksTop",
      "studio.primaryMenuSection.warnings.dupLabelsChildren",
      "studio.primaryMenuSection.warnings.dupLinksChildren",
      "studio.primaryMenuSection.warnings.externalNoNewTab",
      "studio.primaryMenuSection.warnings.externalPrefixOnly",
      "studio.primaryMenuSection.warnings.internalHrefNotFound",
    ] as const,
  },

  seoSection: {
    warnings: [
      "studio.seoSection.warnings.description.length",
      "studio.seoSection.warnings.titleTemplate.placeholderMissing",
      "studio.seoSection.warnings.robots.noindex",
      "studio.seoSection.warnings.openGraph.image.missing",
    ] as const,
    structuredDataEntityTypes: [
      "studio.seoForm.indexing.structuredData.entityType.options.person",
      "studio.seoForm.indexing.structuredData.entityType.options.organization",
      "studio.seoForm.indexing.structuredData.entityType.options.localBusiness",
      "studio.seoForm.indexing.structuredData.entityType.options.professionalService",
      "studio.seoForm.indexing.structuredData.entityType.options.visualArtist",
      "studio.seoForm.indexing.structuredData.entityType.options.autoRepair",
    ] as const,
  },

  socialSection: {
    warnings: [
      "studio.socialSection.warnings.socialEmpty",
      "studio.socialSection.warnings.dupLinks",
    ] as const,
  },

  cellEditorTabs: {
    kinds: [
      "studio.cellEditorTabs.kinds.richText",
      "studio.cellEditorTabs.kinds.image",
      "studio.cellEditorTabs.kinds.gallery",
      "studio.cellEditorTabs.kinds.carousel",
      "studio.cellEditorTabs.kinds.heading",
      "studio.cellEditorTabs.kinds.spacer",
      "studio.cellEditorTabs.kinds.separator",
      "studio.cellEditorTabs.kinds.buttons",
      "studio.cellEditorTabs.kinds.card",
      "studio.cellEditorTabs.kinds.cardCollection",
      "studio.cellEditorTabs.kinds.extendedCard",
      "studio.cellEditorTabs.kinds.steps",
      "studio.cellEditorTabs.kinds.testimonials",
      "studio.cellEditorTabs.kinds.structuredCard",
      "studio.cellEditorTabs.kinds.form",
      "studio.cellEditorTabs.kinds.timeline",
    ] as const,
  },

  testimonialsCellEditor: {
    displayModes: [
      "studio.cellEditorTabs.testimonialsCellEditor.displayModes.static",
      "studio.cellEditorTabs.testimonialsCellEditor.displayModes.marquee",
    ] as const,
    ratings: [
      "studio.cellEditorTabs.testimonialsCellEditor.ratings.none",
      "studio.cellEditorTabs.testimonialsCellEditor.ratings.1",
      "studio.cellEditorTabs.testimonialsCellEditor.ratings.2",
      "studio.cellEditorTabs.testimonialsCellEditor.ratings.3",
      "studio.cellEditorTabs.testimonialsCellEditor.ratings.4",
      "studio.cellEditorTabs.testimonialsCellEditor.ratings.5",
    ] as const,
  },

  cardCollectionCellEditor: {
    cardKinds: [
      "studio.cellEditorTabs.cardCollectionCellEditor.cardKinds.card",
      "studio.cellEditorTabs.cardCollectionCellEditor.cardKinds.extendedCard",
      "studio.cellEditorTabs.cardCollectionCellEditor.cardKinds.structuredCard",
    ] as const,
    columns: [
      "studio.cellEditorTabs.cardCollectionCellEditor.columns.1",
      "studio.cellEditorTabs.cardCollectionCellEditor.columns.2",
      "studio.cellEditorTabs.cardCollectionCellEditor.columns.3",
      "studio.cellEditorTabs.cardCollectionCellEditor.columns.4",
    ] as const,
    aligns: [
      "studio.cellEditorTabs.cardCollectionCellEditor.aligns.left",
      "studio.cellEditorTabs.cardCollectionCellEditor.aligns.center",
    ] as const,
  },

  imageCellEditor: {
    variants: [
      "studio.cellEditorTabs.imageCellEditor.variants.default",
      "studio.cellEditorTabs.imageCellEditor.variants.wide",
      "studio.cellEditorTabs.imageCellEditor.variants.portrait",
      "studio.cellEditorTabs.imageCellEditor.variants.square",
    ] as const,
  },

  builder: {
    containerMode: [
      "studio.builder.sidebar.section.containerMode.options.contained",
      "studio.builder.sidebar.section.containerMode.options.fullBleed",
    ] as const,
  },
} as const;
