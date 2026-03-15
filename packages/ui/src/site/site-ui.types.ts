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

  body: Readonly<{
    surface: string;
    spacing: string;
    paddingTop: string;
    paddingBottom: string;
  }>;

  blockSection: SiteBlockSectionUi;
  cells: SiteCellsUi;
  pager: SiteDetailPagerUi;

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
  caseStudyCard: SiteCaseStudyCardUi;
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
  containerContained: string;
  containerFullBleed: string;
  grid: string;
  gridCols: Readonly<{
    1: string;
    2: string;
    3: string;
  }>;
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
}>;

export type SiteStepsUi = Readonly<{
  root: string;
  list: string;
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
}>;

export type SiteCardsExtendedUiOverride = DeepPartial<SiteCardsExtendedUi>;

export type SiteCaseStudyCardUi = Readonly<{
  root: string;
  grid: string;
  columns: Readonly<{
    1: string;
    2: string;
    3: string;
  }>;

  card: string;
  mediaWrap: string;
  image: string;
  header: string;
  title: string;
  caption: string;
  content: string;
  section: string;
  sectionTitle: string;
  sectionText: string;

  labels: Readonly<{
    context: string;
    solution: string;
    result: string;
  }>;
}>;

export type SiteCaseStudyCardUiOverride = DeepPartial<SiteCaseStudyCardUi>;

export type SiteImageUi = Readonly<{
  container: string;
  image: string;
  imageCover: string;
  imageDefault: string;
  figure: string;
  caption: string;
}>;

export type SiteImageUiOverride = DeepPartial<SiteImageUi>;

export type SiteCarouselFrameUi = Readonly<{
  root: string;
  viewport: string;
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
    image: string;
  }>;

  contentItem: Readonly<{
    active: string;
    inactive: string;
  }>;

  caseStudyCard: SiteCaseStudyCardUi;
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
}>;

export type SiteNavGalleryUiOverride = DeepPartial<SiteNavGalleryUi>;

export type SiteZoomGalleryUi = Readonly<{
  list: string;
  button: string;
  figure: string;
  image: string;
  overlayPanel: string;
  overlayContent: string;
  columns: Readonly<Record<GalleryMaxColumns, string>>;
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
}>;

export type SiteLogoUiOverride = DeepPartial<SiteLogoUi>;

/* -------------------------------------------------------------------------- */
/* Pager                                                                      */
/* -------------------------------------------------------------------------- */

export type SiteDetailPagerUi = Readonly<{
  nav: string;
  link: string;
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
