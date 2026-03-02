"use client";

/**
 * @file packages/ui/src/lib/social/social-kind-icons.tsx
 * @layer lib/social
 * @description
 * Source de vérité UI pour les réseaux sociaux :
 * - kinds supportés (ordre),
 * - labels (via i18n),
 * - rendu d’icônes (brands `simple-icons`, génériques `lucide-react`).
 *
 * Invariants :
 * - On renvoie un `ReactNode` (pas un composant) pour éviter le warning React.
 * - `twitter` est un alias legacy : il est normalisé vers `x`.
 */

import type { ReactNode, SVGProps } from "react";

import {
  Globe,
  Linkedin,
  Link as LinkIcon,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";

import {
  siBehance,
  siDribbble,
  siFacebook,
  siGithub,
  siInstagram,
  siTiktok,
  siX,
  siYoutube,
} from "simple-icons/icons";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SocialKind =
  | "website"
  | "email"
  | "phone"
  | "custom"
  | "github"
  | "linkedin"
  | "instagram"
  | "x"
  | "youtube"
  | "tiktok"
  | "facebook"
  | "behance"
  | "dribbble"
  | "whatsapp";

type SimpleIcon = {
  title: string;
  hex: string;
  path: string;
  viewBox?: string;
};

export type SocialIconRenderProps = Readonly<{
  className?: string;
}>;

export type SocialKindOption = Readonly<{
  value: SocialKind;
  label: string;
}>;

/**
 * Clés i18n canoniques (admin) pour les labels de `SocialKind`.
 * NB : le fallback FR reste défini dans `SOCIAL_KIND_LABEL` pour les usages non i18n.
 */
export const SOCIAL_KIND_LABEL_KEYS = {
  website: "admin.social.kind.website",
  email: "admin.social.kind.email",
  phone: "admin.social.kind.phone",
  custom: "admin.social.kind.custom",
  whatsapp: "admin.social.kind.whatsapp",
  github: "admin.social.kind.github",
  linkedin: "admin.social.kind.linkedin",
  instagram: "admin.social.kind.instagram",
  x: "admin.social.kind.x",
  youtube: "admin.social.kind.youtube",
  tiktok: "admin.social.kind.tiktok",
  facebook: "admin.social.kind.facebook",
  behance: "admin.social.kind.behance",
  dribbble: "admin.social.kind.dribbble",
} as const satisfies Readonly<Record<SocialKind, string>>;

/**
 * Union littérale des clés i18n possibles pour SocialKind.
 * ✅ Objectif : rendre les clés "scannables" et typées (TS + i18n Ally).
 */
export type SocialKindLabelKey = (typeof SOCIAL_KIND_LABEL_KEYS)[SocialKind];

/**
 * Traducteur pour les labels de SocialKind.
 * ✅ N'accepte que des clés connues (pas de `string` libre).
 */
export type SocialKindTranslator = (key: SocialKindLabelKey) => string;

/* -------------------------------------------------------------------------- */
/*                           Simple Icons renderer                             */
/* -------------------------------------------------------------------------- */

/**
 * Rend une icône `simple-icons` en SVG React.
 * - Couleur = `currentColor` (hérite du texte)
 * - `aria-hidden` par défaut (dans un Select, l'icône est décorative)
 */
function SimpleBrandIcon({
  icon,
  className,
  ...svgProps
}: { icon: SimpleIcon } & SVGProps<SVGSVGElement>) {
  const viewBox = icon.viewBox ?? "0 0 24 24";

  return (
    <svg
      viewBox={viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden
      className={className}
      {...svgProps}
    >
      <path d={icon.path} />
    </svg>
  );
}

SimpleBrandIcon.displayName = "SimpleBrandIcon";

/* -------------------------------------------------------------------------- */
/*                              Source de vérité                               */
/* -------------------------------------------------------------------------- */

export const SOCIAL_KIND_LABEL: Readonly<Record<SocialKind, string>> = {
  website: "Site web",
  email: "E-mail",
  phone: "Téléphone",
  custom: "Lien",
  whatsapp: "WhatsApp",
  github: "GitHub",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X (Twitter)",
  youtube: "YouTube",
  tiktok: "TikTok",
  facebook: "Facebook",
  behance: "Behance",
  dribbble: "Dribbble",
} as const;

/**
 * Liste ordonnée des kinds supportés par l’UI (Select / preview).
 * 👉 Source de vérité : plus de duplication dans les composants.
 *
 * Si `t` est fourni, les labels proviennent de l’i18n.
 * Sinon, on retombe sur le fallback local `SOCIAL_KIND_LABEL`.
 */
export function buildSocialKindOptions(
  t?: SocialKindTranslator,
): ReadonlyArray<SocialKindOption> {
  const labelOf = (kind: SocialKind) =>
    t ? t(SOCIAL_KIND_LABEL_KEYS[kind]) : SOCIAL_KIND_LABEL[kind];

  return [
    { value: "email", label: labelOf("email") },
    { value: "website", label: labelOf("website") },
    { value: "github", label: labelOf("github") },
    { value: "linkedin", label: labelOf("linkedin") },
    { value: "x", label: labelOf("x") },
    { value: "instagram", label: labelOf("instagram") },
    { value: "facebook", label: labelOf("facebook") },
    { value: "tiktok", label: labelOf("tiktok") },
    { value: "youtube", label: labelOf("youtube") },
    { value: "behance", label: labelOf("behance") },
    { value: "dribbble", label: labelOf("dribbble") },
    // Optionnels “génériques”
    // { value: "phone", label: labelOf("phone") },
    // { value: "whatsapp", label: labelOf("whatsapp") },
    // { value: "custom", label: labelOf("custom") },
  ] as const;
}

const BRAND_ICONS: Readonly<Partial<Record<SocialKind, SimpleIcon>>> = {
  github: siGithub,
  instagram: siInstagram,
  x: siX,
  youtube: siYoutube,
  tiktok: siTiktok,
  facebook: siFacebook,
  behance: siBehance,
  dribbble: siDribbble,
} as const;

const DEFAULT_ICON_CLASS = "h-4 w-4 flex-none overflow-visible";

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/**
 * Normalise un kind entrant (legacy) vers un kind UI.
 *
 * @remarks
 * - case-insensitive (admin input / dataset legacy)
 * - `twitter` (legacy dataset) → `x`
 */
export function normalizeSocialKind(kind: string): string {
  const k = kind.trim().toLowerCase();
  return k === "twitter" ? "x" : k;
}

function isSocialKind(value: string): value is SocialKind {
  return Object.prototype.hasOwnProperty.call(SOCIAL_KIND_LABEL, value);
}

/**
 * Helper safe : rend une icône (fallback générique si kind inconnu).
 *
 * @remarks
 * - On renvoie un ReactNode (pas un composant) => pas de warning React.
 */
export function renderSocialKindIcon(
  kind: string,
  props: SocialIconRenderProps = {},
): ReactNode {
  const k = normalizeSocialKind(kind);
  const className = props.className ?? DEFAULT_ICON_CLASS;

  // Brands (simple-icons)
  if (isSocialKind(k)) {
    const brand = BRAND_ICONS[k];
    if (brand) {
      return <SimpleBrandIcon icon={brand} className={className} />;
    }
  }

  // Génériques (lucide)
  switch (k) {
    case "website":
      return <Globe className={className} aria-hidden />;
    case "email":
      return <Mail className={className} aria-hidden />;
    case "phone":
      return <Phone className={className} aria-hidden />;
    case "linkedin":
      return <Linkedin className={className} aria-hidden />;
    case "whatsapp":
      return <MessageCircle className={className} aria-hidden />;
    case "custom":
      return <LinkIcon className={className} aria-hidden />;
    default:
      return <LinkIcon className={className} aria-hidden />;
  }
}

/**
 * Construit des items prêts pour ton `SelectField`.
 * ⚠️ nécessite que `SelectField` accepte `label: ReactNode`.
 */
export function buildSocialKindSelectItems(
  t?: SocialKindTranslator,
): ReadonlyArray<{
  value: SocialKind;
  label: ReactNode;
}> {
  const options = buildSocialKindOptions(t);

  return options.map((opt) => ({
    value: opt.value,
    label: (
      <span className="inline-flex items-center gap-4 min-w-0">
        {renderSocialKindIcon(opt.value)}
        <span className="truncate">{opt.label}</span>
      </span>
    ),
  }));
}
