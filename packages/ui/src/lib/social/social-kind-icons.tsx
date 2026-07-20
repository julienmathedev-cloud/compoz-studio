/**
 * @file packages/ui/src/lib/social/social-kind-icons.tsx
 * @layer ui/lib/social
 * @description UI source of truth for supported social kinds, labels, and icons.
 * @remarks
 * Icon rendering returns a `ReactNode` to avoid React component warnings.
 */

import type { SocialKind } from "@compoz/core/constants/social/social-kinds";
import type { ReactNode, SVGProps } from "react";

import { Globe, Linkedin, Mail } from "lucide-react";

import {
  siBehance,
  siDribbble,
  siFacebook,
  siGithub,
  siInstagram,
  siPinterest,
  siSoundcloud,
  siSpotify,
  siTiktok,
  siX,
  siYoutube,
} from "simple-icons/icons";

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

export const SOCIAL_KIND_LABEL_KEYS = {
  website: "studio.social.kind.website",
  email: "studio.social.kind.email",
  github: "studio.social.kind.github",
  linkedin: "studio.social.kind.linkedin",
  instagram: "studio.social.kind.instagram",
  x: "studio.social.kind.x",
  youtube: "studio.social.kind.youtube",
  tiktok: "studio.social.kind.tiktok",
  facebook: "studio.social.kind.facebook",
  behance: "studio.social.kind.behance",
  dribbble: "studio.social.kind.dribbble",
  pinterest: "studio.social.kind.pinterest",
  soundcloud: "studio.social.kind.soundcloud",
  spotify: "studio.social.kind.spotify",
} as const satisfies Readonly<Record<SocialKind, string>>;

export type SocialKindLabelKey = (typeof SOCIAL_KIND_LABEL_KEYS)[SocialKind];

export type SocialKindTranslator = (key: SocialKindLabelKey) => string;

type SimpleBrandIconProps = { icon: SimpleIcon } & SVGProps<SVGSVGElement>;

function SimpleBrandIcon({
  icon,
  className,
  ...svgProps
}: SimpleBrandIconProps) {
  const viewBox = icon.viewBox ?? "0 0 24 24";

  return (
    <svg
      viewBox={viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...svgProps}
    >
      <path d={icon.path} />
    </svg>
  );
}

SimpleBrandIcon.displayName = "SimpleBrandIcon";

export const SOCIAL_KIND_LABEL: Readonly<Record<SocialKind, string>> = {
  website: "Site web",
  email: "E-mail",
  github: "GitHub",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  x: "X (Twitter)",
  youtube: "YouTube",
  tiktok: "TikTok",
  facebook: "Facebook",
  behance: "Behance",
  dribbble: "Dribbble",
  pinterest: "Pinterest",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
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
    { value: "pinterest", label: labelOf("pinterest") },
    { value: "soundcloud", label: labelOf("soundcloud") },
    { value: "spotify", label: labelOf("spotify") },
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
  pinterest: siPinterest,
  soundcloud: siSoundcloud,
  spotify: siSpotify,
} as const;

const DEFAULT_ICON_CLASS = "h-4 w-4 flex-none overflow-visible";

/** Normalizes case-insensitive input to a UI social kind. */
export function normalizeSocialKind(kind: string): string {
  return String(kind ?? "")
    .trim()
    .toLowerCase();
}

function isSocialKind(value: string): value is SocialKind {
  return Object.prototype.hasOwnProperty.call(SOCIAL_KIND_LABEL, value);
}

export function renderSocialKindIcon(
  kind: string,
  props: SocialIconRenderProps = {},
): ReactNode {
  const k = normalizeSocialKind(kind);
  const className = props.className ?? DEFAULT_ICON_CLASS;

  if (isSocialKind(k)) {
    const brand = BRAND_ICONS[k];
    if (brand) {
      return <SimpleBrandIcon icon={brand} className={className} />;
    }
  }

  switch (k) {
    case "website":
      return <Globe className={className} aria-hidden />;
    case "email":
      return <Mail className={className} aria-hidden />;
    default:
      return <Linkedin className={className} aria-hidden />;
  }
}

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
      <span className="inline-flex min-w-0 items-center gap-4">
        {renderSocialKindIcon(opt.value)}
        <span className="truncate">{opt.label}</span>
      </span>
    ),
  }));
}
