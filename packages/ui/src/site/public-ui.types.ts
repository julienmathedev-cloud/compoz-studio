/**
 * @file packages/ui/src/site/public-ui.types.ts
 * @layer lib/ui
 *
 * @description
 * Types définis pour le runtime UI public (skins).
 * Ces types sont utilisés pour le runtime (merge) et le debug (inspect).
 *
 * Contrat : tous les champs sont optionnels (par défaut).
 */
import type { GalleryMaxColumns } from "@compoz/core/domain/pages/entities/cell";

/** DeepPartial (lié au système de skins public UI) */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * ✅ Type runtime COMPLET : ce que le renderer consomme (aucun undefined).
 * Le `defaultGlobalUi` doit satisfaire ce type.
 */
export type PublicGlobalUi = Readonly<{
  header: PublicHeaderUi;
  footer: PublicFooterUi;

  body: Readonly<{
    surface: string;
    pageHeading: Readonly<{ h1: string }>;
    spacing: string;
    paddingTop: string;
    paddingBottom: string;
  }>;

  layoutSection: PublicLayoutSectionUi;
  blocks: PublicBlocksUi;
  pager: PublicDetailPagerUi;

  systemPage: PublicSystemPageUi;
  systemLoading: PublicSystemLoadingUi;
}>;

/** ✅ Type “skin override” : partiel (deep) */
export type PublicGlobalUiOverride = DeepPartial<PublicGlobalUi>;

/** Blocks */
export type PublicBlocksUi = Readonly<{
  richText: PublicRichTextUi;
  image: PublicImageUi;
  navGallery: PublicNavGalleryUi;
  zoomGallery: PublicZoomGalleryUi;
  carousel: PublicCarouselUi;
}>;

export type PublicBlocksUiOverride = DeepPartial<PublicBlocksUi>;

export type PublicLayoutSectionUi = Readonly<{
  /** Container si "contained" (max-width + px + py). */
  containerContained: string;

  /** Container si "fullBleed" (w-full, et éventuellement py). */
  containerFullBleed: string;

  /** Wrapper grid. */
  grid: string;

  /** Classes conditionnelles de colonnes (pilotées par le skin). */
  gridCols: Readonly<{
    1: string;
    2: string;
    3: string;
  }>;

  /** Wrapper d’une cell. */
  cell: string;
}>;

export type PublicLayoutSectionUiOverride = DeepPartial<PublicLayoutSectionUi>;

/** Cells */
/**
 * Richtext
 */

export type PublicRichTextUi = Readonly<{
  root: string;
}>;

export type PublicRichTextUiOverride = DeepPartial<PublicRichTextUi>;

/**
 * Image
 */
export type PublicImageUi = Readonly<{
  /** Wrapper (utilisé pour les variantes "wide"/"square"). */
  container: string;

  /** Classes de l'image (PublicAppImage). */
  image: string;

  /** Classes image quand on est en mode "cover" (wide/square). */
  imageCover: string;

  /** Classes image quand on est en mode "default" (sans frame). */
  imageDefault: string;
}>;

export type PublicImageUiOverride = DeepPartial<PublicImageUi>;

/**
 * Carousel
 */
export type PublicCarouselUi = Readonly<{
  /** Container mode ratio (ex: aspect-video) */
  containerRatio: string;

  /** Container mode fill (ex: height hero) */
  containerFill: string;

  /** Classe image (skin) */
  image: string;
}>;

/**
 * Galerie
 */
export type PublicCarouselUiOverride = DeepPartial<PublicCarouselUi>;

export type PublicNavGalleryUi = Readonly<{
  list: string;
  link: string;
  figure: string;
  image: string;
  overlayPanel: string;
  overlayContent: string;
  columns: Readonly<Record<GalleryMaxColumns, string>>;
}>;

export type PublicNavGalleryUiOverride = DeepPartial<PublicNavGalleryUi>;

export type PublicZoomGalleryUi = Readonly<{
  list: string;
  button: string;
  figure: string;
  image: string;
  overlayPanel: string;
  overlayContent: string;
  columns: Readonly<Record<GalleryMaxColumns, string>>;
  lightbox: PublicLightboxUi;
}>;

export type PublicZoomGalleryUiOverride = DeepPartial<PublicZoomGalleryUi>;

/**
 * LightBox
 */
export type PublicLightboxUi = Readonly<{
  overlay: string;
  panel: string;
  panelEnter: string;
  panelExit: string;
  panelFrom: string;
  closeButton: string;
  closeIcon: string;
  imageWrap: string;
  image: string;
  caption: string;
}>;

export type PublicLightboxUiOverride = DeepPartial<PublicLightboxUi>;

/** Settings */
/**
 * Footer
 */

export type PublicFooterUi = Readonly<{
  footer: string;
  footerContainer: string;
  copyright: string;
  legalMenu: PublicLegalMenuUi;
}>;

export type PublicFooterUiOverride = DeepPartial<PublicFooterUi>;

/**
 * Header
 */

export type PublicHeaderUi = Readonly<{
  /** <header> */
  header: Readonly<{
    base: string;
    sticky: string;
    blur: string;
  }>;

  /** Skip link (visible au focus). */
  skipLink: string;

  /** Conteneur interne (max-width + padding + flex) */
  headerContainer: string;

  /** logo et menus */
  logoSlot: string;

  /** nom du site */
  siteNameText: string;

  nav: string;

  /** Sous-composants */
  logo: PublicLogoUi;
  mobileMenu: PublicMobileMenuUi;
  menu: PublicPrimaryMenuUi;
  social: PublicSocialMenuUi;
}>;

export type PublicHeaderUiOverride = DeepPartial<PublicHeaderUi>;

/**
 * LegalMenu
 */
export type PublicLegalMenuUi = Readonly<{
  /** Classes appliquées par le skin/template (nav). */
  nav: string;
  /** Classes appliquées par le skin/template (list). */
  list: string;
  /** Classes appliquées par le skin/template (item). */
  item: string;
  /** Classes appliquées par le skin/template (zone interactive). */
  interactive: string;
  /** Classes appliquées par le skin/template (lien). */
  link: string;
}>;

/**
 * PrimaryMenu
 */

export type PublicPrimaryMenuUi = Readonly<{
  /** Classes appliquées par le skin/template (list). */
  list: string;

  /** Classes appliquées par le skin/template (item). */
  item: string;

  /** Classes appliquées par le skin/template (lien). */
  link: string;

  /**
   * Classes appliquées par le skin/template (zone interactive : lien + trigger dropdown).
   */
  interactive: string;

  /** Classes appliquées par le skin/template (panel dropdown). */
  dropdownPanel: string;
}>;

export type PublicPrimaryMenuUiOverride = DeepPartial<PublicPrimaryMenuUi>;

/**
 * SocialMenu
 */

export type PublicSocialMenuUi = Readonly<{
  /** Classes appliquées au <ul>. */
  list: string;

  /** Classes appliquées au <li>. */
  item: string;

  /** Classes appliquées à la zone interactive (lien + trigger dropdown). */
  interactive: string;

  /** Classes appliquées au lien. */
  link: string;

  /** Classes appliquées à l’icône. */
  icon: string;
}>;

export type PublicSocialMenuUiOverride = DeepPartial<PublicSocialMenuUi>;

/**
 * MobileMenu
 */
export type PublicMobileMenuUi = Readonly<{
  triggerButton: string;
  triggerIcon: string;

  overlayBase: string;
  overlayOpen: string;
  overlayClosed: string;

  panelBase: string;
  panelOpen: string;
  panelClosed: string;

  topBar: string;
  closeButton: string;

  scrollArea: string;

  list: string;
  item: string;

  // Root link & dropdown summary share the same “interactive slot”
  interactive: string;
  link: string;

  details: string;
  summary: string;
  dropdownList: string;
  childItem: string;
  childInteractive: string;

  socialsRow: string;

  /** classes appliquées au lien social (zone interactive) */
  socialLink: string;

  /** classes appliquées à l’icône */
  socialIcon?: string;

  focusRing: string;

  // Optionnel
  emptyState: string;
}>;

export type PublicMobileMenuUiOverride = DeepPartial<PublicMobileMenuUi>;

/**
 * Logo
 */
export type PublicLegalMenuUiOverride = DeepPartial<PublicLegalMenuUi>;

export type PublicLogoUi = Readonly<{
  /** Classes appliquées par le skin/template (Link). */
  link: string;

  /** Classes appliquées par le skin/template (Image). */
  image: string;
}>;

export type PublicLogoUiOverride = DeepPartial<PublicLogoUi>;

/**
 * Pager
 */
export type PublicDetailPagerUi = Readonly<{
  /** <nav> wrapper */
  nav: string;

  /** Classes appliquées au lien (linkClassName) */
  link: string;

  /** Label text (ex: line-clamp) */
  label: string;

  /** Icon */
  icon: string;
}>;

export type PublicDetailPagerUiOverride = DeepPartial<PublicDetailPagerUi>;

/**
 * Systeme
 */
export type PublicSystemLoadingUi = Readonly<{
  /** Wrapper full height du main (centrage). */
  container: string;
  /** Spinner. */
  spinner: string;
}>;

export type PublicSystemLoadingUiOverride = DeepPartial<PublicSystemLoadingUi>;

export type PublicSystemPageUi = Readonly<{
  main: string;
  prose: string;
  title: string;
  description: string;
  actions: string;
  button: string;
}>;

export type PublicSystemPageUiOverride = DeepPartial<PublicSystemPageUi>;
