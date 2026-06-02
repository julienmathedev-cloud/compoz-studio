/**
 * @file packages/ui/src/site/site-ui.types.ts
 * @layer ui/site
 *
 * @description
 * Types définis pour le runtime UI du site (skins).
 * Ces types sont utilisés pour le runtime (merge) et le debug (inspect).
 *
 * Contrat : tous les champs sont optionnels (par défaut).
 */
import type { GalleryMaxColumns } from "@compoz/core/domain/pages/entities/cell";

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/* -------------------------------------------------------------------------- */
/* Global UI                                                                  */
/* -------------------------------------------------------------------------- */

export type SiteGlobalUi = Readonly<{
  header: SiteHeaderUi;
  footer: SiteFooterUi;
  blockSection: SiteBlockSectionUi;
  cells: SiteCellsUi;
  pager: SiteDetailPagerUi;
  reveal: SiteRevealUi;

  systemPage: SiteSystemPageUi;
  systemLoading: SiteSystemLoadingUi;
}>;

export type SiteGlobalUiOverride = DeepPartial<SiteGlobalUi>;

/* -------------------------------------------------------------------------- */
/* Cells                                                                      */
/* -------------------------------------------------------------------------- */

export type SiteCellsUi = Readonly<{
  richText: SiteRichTextUi;
  heading: SiteHeadingUi;
  spacer: SiteSpacerUi;
  separator: SiteSeparatorUi;
  buttons: SiteButtonsUi;
  cards: SiteCardsUi;
  cardsExtended: SiteCardsExtendedUi;
  steps: SiteStepsUi;
  structuredCard: SiteStructuredCardUi;
  image: SiteImageUi;
  navGallery: SiteNavGalleryUi;
  zoomGallery: SiteZoomGalleryUi;
  carousel: SiteCarouselUi;
  form: SiteFormUi;
  timeline: SiteTimelineUi;
}>;

export type SiteCellsUiOverride = DeepPartial<SiteCellsUi>;

/* -------------------------------------------------------------------------- */
/* Block section                                                              */
/* -------------------------------------------------------------------------- */

export type SiteBlockSectionUi = Readonly<{
  surface: string;
  containerContained: string;
  containerFullBleed: string;
  sectionSpacingContained: string;
  rows: string;
  grid: string;
  gridCols: Readonly<{
    1: string;
    2: string;
    3: string;
  }>;
  column: string;
  cell: string;
}>;

export type SiteBlockSectionUiOverride = DeepPartial<SiteBlockSectionUi>;

/* -------------------------------------------------------------------------- */
/* Cells                                                                      */
/* -------------------------------------------------------------------------- */

export type SiteFormUi = Readonly<{
  card: string;
  form: string;
  header: string;
  content: string;
  fields: string;
  field: string;
  label: string;
  input: string;
  textarea: string;
  help: string;
  footer: string;
  submitButton: string;
}>;

export type SiteFormUiOverride = DeepPartial<SiteFormUi>;

export type SiteRichTextUi = Readonly<{
  root: string;
}>;

export type SiteRichTextUiOverride = DeepPartial<SiteRichTextUi>;

export type SiteHeadingUi = Readonly<{
  container: string;
  containerHero: string;
  level: Record<"h1" | "h2" | "h3" | "h4" | "h5" | "h6", string>;
  levelHero: string;
  subtitle: string;
  subtitleHero: string;
  separator: string;
  separatorHero: string;
  highlight: string;
}>;

export type SiteHeadingUiOverride = DeepPartial<SiteHeadingUi>;

export type SiteSpacerUi = Readonly<{
  root: string;
  size: Readonly<{
    sm: string;
    md: string;
    lg: string;
    xl: string;
  }>;
}>;

export type SiteSpacerUiOverride = DeepPartial<SiteSpacerUi>;

export type SiteSeparatorUi = Readonly<{
  root: string;
  align: Readonly<{
    left: string;
    center: string;
    right: string;
    full: string;
  }>;
  size: Readonly<{
    sm: string;
    md: string;
    lg: string;
  }>;
  line: string;
}>;

export type SiteSeparatorUiOverride = DeepPartial<SiteSeparatorUi>;

export type SiteButtonsUi = Readonly<{
  root: string;
  list: string;
  align: Readonly<{
    left: string;
    center: string;
    right: string;
  }>;
  gap: Readonly<{
    sm: string;
    md: string;
    lg: string;
  }>;
  button: string;
}>;

export type SiteButtonsUiOverride = DeepPartial<SiteButtonsUi>;

export type SiteStepCardUi = Readonly<{
  root: string;

  header: string;

  content: string;

  badge: string;

  title: string;

  description: string;

  align: Readonly<{
    left: string;
    center: string;
  }>;

  /**
   * Layout balanced (optionnel)
   */
  headerBalanced?: string;
  headerBadgeSlot?: string;
  headerSpacerSlot?: string;
}>;

export type SiteStepsUi = Readonly<{
  root: string;
  list: string;
  connector: string;
  connectorIcon: string;
  card: SiteStepCardUi;
}>;

export type SiteStepsUiOverride = DeepPartial<SiteStepsUi>;

export type SiteStepCardUiOverride = DeepPartial<SiteStepCardUi>;

export type SiteCardsUi = Readonly<{
  root: string;
  grid: string;
  columns: Readonly<{
    2: string;
    3: string;
    4: string;
  }>;
  align: Record<"left" | "center", string>;
  card: string;
  header: string;
  headerTop: string;
  iconContainer: string;
  icon: string;
  title: string;
  content: string;
  description: string;
}>;

export type SiteCardsUiOverride = DeepPartial<SiteCardsUi>;

export type SiteCardsExtendedUi = Readonly<{
  root: string;

  grid: string;

  columns: Readonly<{
    1: string;
    2: string;
    3: string;
  }>;

  align: Readonly<{
    left: string;
    center: string;
  }>;

  card: string;

  header: string;

  headerTop: string;

  icon: string;

  title: string;

  content: string;

  description: string;

  bulletsList: string;

  bulletsAlign: Readonly<{
    left: string;
    center: string;
  }>;

  footer: string;

  footerAlign: Readonly<{
    left: string;
    center: string;
  }>;
}>;

export type SiteCardsExtendedUiOverride = DeepPartial<SiteCardsExtendedUi>;

export type SiteStructuredCardUi = Readonly<{
  root: string;
  grid: string;
  columns: Readonly<{
    1: string;
    2: string;
    3: string;
  }>;

  card: string;
  imageWrapper: string;
  image: string;
  header: string;
  title: string;
  caption: string;
  content: string;
  sections: string;
  section: string;
  sectionTitle: string;
  sectionText: string;
  buttonWrapper: string;
  button: string;
}>;

export type SiteStructuredCardUiOverride = DeepPartial<SiteStructuredCardUi>;

export type SiteImageUi = Readonly<{
  root: string;
  figure: string;
  caption: string;
  container: string;
  image: string;
  button: string;
  lightbox: SiteLightboxUi;
  imageDefault: string;
  imageCover: string;

  variantMode: Readonly<{
    default: "default" | "cover";
    wide: "default" | "cover";
    square: "default" | "cover";
    portrait: "default" | "cover";
  }>;

  variantFrame: Readonly<{
    default: string;
    wide: string;
    square: string;
    portrait: string;
  }>;

  variantSizes: Readonly<{
    default: string;
    wide: string;
    square: string;
    portrait: string;
  }>;

  size: Readonly<{
    sm: string;
    md: string;
    lg: string;
    full: string;
  }>;
}>;

export type SiteImageUiOverride = DeepPartial<SiteImageUi>;

export type SiteCarouselFrameUi = Readonly<{
  root: string;
  viewport: string;
  viewportFullBleed: string;
  track: string;
  slide: string;
  slideActive: string;
  slideInactive: string;
  arrowButton: string;
  arrowIcon: string;
  dots: string;
  dot: string;
  dotActive: string;
  dotInactive: string;
}>;

export type SiteSliderUi = Readonly<{
  root: string;
  track: string;
  slide: string;
  slideActive: string;
  slideInactive: string;
  arrowButton: string;
  arrowIcon: string;
  dots: string;
  dot: string;
  dotActive: string;
  dotInactive: string;
}>;

export type SiteCarouselUi = Readonly<{
  carousel: SiteCarouselFrameUi;
  slider: SiteSliderUi;

  imageItem: Readonly<{
    ratioContainer: string;
    fillContainer: string;
    containedImage: string;
    coverImage: string;
    caption: string;
  }>;

  imageItemSlider: Readonly<{
    ratioContainer: string;
    fillContainer: string;
    containedImage: string;
    coverImage: string;
    caption: string;
  }>;

  contentItem: Readonly<{
    active: string;
    inactive: string;
  }>;

  card: SiteCardsUi;
  structuredCard: SiteStructuredCardUi;
  extendedCard: SiteCardsExtendedUi;
}>;

export type SiteCarouselUiOverride = DeepPartial<SiteCarouselUi>;

export type SiteNavGalleryUi = Readonly<{
  list: string;
  link: string;
  figure: string;
  image: string;
  overlayPanel: string;
  overlayContent: string;
  columns: Readonly<Record<GalleryMaxColumns, string>>;
  sizesByColumns: Readonly<Record<GalleryMaxColumns, string>>;
}>;

export type SiteNavGalleryUiOverride = DeepPartial<SiteNavGalleryUi>;

export type SiteZoomGalleryUi = Readonly<{
  list: string;

  columns: Readonly<Record<GalleryMaxColumns, string>>;

  sizesByColumns: Readonly<Record<GalleryMaxColumns, string>>;

  button: string;
  figure: string;
  image: string;
  overlayPanel: string;
  overlayContent: string;

  lightbox: SiteLightboxUi;
}>;

export type SiteZoomGalleryUiOverride = DeepPartial<SiteZoomGalleryUi>;

export type SiteLightboxUi = Readonly<{
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

export type SiteLightboxUiOverride = DeepPartial<SiteLightboxUi>;

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export type SiteFooterUi = Readonly<{
  footer: string;
  footerContainer: string;
  poweredBy: string;
  poweredByLink: string;
  copyright: string;
  legalMenu: SiteLegalMenuUi;
}>;

export type SiteFooterUiOverride = DeepPartial<SiteFooterUi>;

export type SiteHeaderUi = Readonly<{
  header: Readonly<{
    base: string;
    sticky: string;
    blur: string;
  }>;
  skipLink: string;
  headerContainer: string;
  logoSlot: string;
  siteNameText: string;
  nav: string;
  logo: SiteLogoUi;
  mobileMenu: SiteMobileMenuUi;
  menu: SitePrimaryMenuUi;
  social: SiteSocialMenuUi;
}>;

export type SiteHeaderUiOverride = DeepPartial<SiteHeaderUi>;

export type SiteLegalMenuUi = Readonly<{
  nav: string;
  list: string;
  item: string;
  interactive: string;
  link: string;
}>;

export type SiteLegalMenuUiOverride = DeepPartial<SiteLegalMenuUi>;

export type SitePrimaryMenuUi = Readonly<{
  list: string;
  item: string;
  link: string;
  label: string;
  interactive: string;
  dropdownPanel: string;
}>;

export type SitePrimaryMenuUiOverride = DeepPartial<SitePrimaryMenuUi>;

export type SiteSocialMenuUi = Readonly<{
  list: string;
  item: string;
  interactive: string;
  link: string;
  icon: string;
}>;

export type SiteSocialMenuUiOverride = DeepPartial<SiteSocialMenuUi>;

export type SiteMobileMenuUi = Readonly<{
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
  interactive: string;
  link: string;
  details: string;
  chevron: string;
  summary: string;
  dropdownList: string;
  childItem: string;
  childInteractive: string;
  socialsRow: string;
  socialLink: string;
  socialIcon?: string;
  focusRing: string;
  emptyState: string;
}>;

export type SiteMobileMenuUiOverride = DeepPartial<SiteMobileMenuUi>;

export type SiteLogoUi = Readonly<{
  link: string;
  image: string;
  sizes: string;
}>;

export type SiteLogoUiOverride = DeepPartial<SiteLogoUi>;

/* -------------------------------------------------------------------------- */
/* Pager                                                                      */
/* -------------------------------------------------------------------------- */

export type SiteDetailPagerUi = Readonly<{
  nav: string;
  link: string;
  wrapper: string;
  label: string;
  icon: string;
}>;

export type SiteDetailPagerUiOverride = DeepPartial<SiteDetailPagerUi>;

/* -------------------------------------------------------------------------- */
/* System                                                                     */
/* -------------------------------------------------------------------------- */

export type SiteSystemLoadingUi = Readonly<{
  container: string;
  spinner: string;
}>;

export type SiteSystemLoadingUiOverride = DeepPartial<SiteSystemLoadingUi>;

export type SiteSystemPageUi = Readonly<{
  main: string;
  prose: string;
  title: string;
  description: string;
  actions: string;
  button: string;
}>;

export type SiteSystemPageUiOverride = DeepPartial<SiteSystemPageUi>;

export type SiteTimelineItemUi = Readonly<{
  root: string;

  row: string;
  rowLeft: string;
  rowRight: string;
  mobileRow: string;

  side: string;

  center: string;
  connector: string;
  connectorLeft: string;
  connectorRight: string;

  contentWrap: string;

  cardWrap: string;
  cardWrapLeft: string;
  cardWrapRight: string;

  badgeWrap: string;
  badge: string;

  card: string;
  cardLeft: string;
  cardRight: string;
  cardInner: string;

  textLeft: string;
  textRight: string;
  textBlock: string;

  period: string;
  title: string;
  subtitle: string;
  description: string;

  keywordsWrap: string;
  keywordsWrapLeft: string;
  keywordsWrapRight: string;
  keyword: string;
}>;

export type SiteTimelineItemUiOverride = DeepPartial<SiteTimelineItemUi>;

export type SiteTimelineUi = Readonly<{
  root: string;

  triggerWrap: string;
  triggerButton: string;
  triggerIcon: string;
  triggerIconOpen: string;
  triggerIconClosed: string;

  collapse: string;

  desktopRailWrap: string;
  desktopStartDot: string;
  desktopLine: string;
  desktopEndDot: string;

  contentWrap: string;

  mobileRailWrap: string;
  mobileStartDot: string;
  mobileLine: string;
  mobileEndDot: string;

  itemsWrap: string;

  item: SiteTimelineItemUi;
}>;

export type SiteTimelineUiOverride = DeepPartial<SiteTimelineUi>;

export type SiteRevealPresetUi = Readonly<{
  hidden: Readonly<{
    opacity: number;
    y?: number;
    scale?: number;
  }>;
  visible: Readonly<{
    opacity: number;
    y?: number;
    scale?: number;
  }>;
  transition: Readonly<{
    duration: number;
    ease: "linear" | "easeIn" | "easeOut" | "easeInOut";
  }>;
}>;

export type SiteRevealPresetUiOverride = DeepPartial<SiteRevealPresetUi>;

export type SiteRevealUi = Readonly<{
  fade: SiteRevealPresetUi;
  "fade-up": SiteRevealPresetUi;
  "scale-in": SiteRevealPresetUi;
  "slide-up": SiteRevealPresetUi;
}>;

export type SiteRevealUiOverride = DeepPartial<SiteRevealUi>;
