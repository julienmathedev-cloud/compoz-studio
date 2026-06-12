/**
 * @file packages/ui/src/lib/fonts.ts
 * @layer ui/lib
 *
 * @description
 * Registre des polices du site public exposées via `next/font/google`
 * sous forme de variables CSS `--font-*`.
 *
 * @remarks
 * - Toutes les polices supportées par le thème sont déclarées ici.
 * - Le choix de la police active reste piloté par `ThemeProvider`.
 * - Ici, on se contente d’exposer les variables CSS au runtime.
 */

import {
  Abril_Fatface,
  Bebas_Neue,
  Caveat,
  Cormorant_Garamond,
  DM_Sans,
  Fjalla_One,
  Inter,
  Libre_Baskerville,
  Lora,
  Manrope,
  Merriweather,
  Oswald,
  Outfit,
  Pacifico,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Sora,
  Source_Serif_4,
  Space_Grotesk,
  Urbanist,
  Spectral,
} from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather",
  display: "swap",
});

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif-4",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
  display: "swap",
});

const abrilFatface = Abril_Fatface({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-abril-fatface",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const fjallaOne = Fjalla_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fjalla-one",
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-spectral",
  display: "swap",
});

export type FontKey =
  | "inter"
  | "manrope"
  | "plus-jakarta-sans"
  | "dm-sans"
  | "outfit"
  | "sora"
  | "urbanist"
  | "space-grotesk"
  | "playfair-display"
  | "cormorant-garamond"
  | "lora"
  | "merriweather"
  | "source-serif-4"
  | "libre-baskerville"
  | "bebas-neue"
  | "abril-fatface"
  | "oswald"
  | "pacifico"
  | "caveat"
  | "fjalla-one"
  | "spectral";

const fontVariablesByKey: Readonly<Record<FontKey, string>> = {
  inter: inter.variable,
  manrope: manrope.variable,
  "plus-jakarta-sans": plusJakartaSans.variable,
  "dm-sans": dmSans.variable,
  outfit: outfit.variable,
  sora: sora.variable,
  urbanist: urbanist.variable,
  "space-grotesk": spaceGrotesk.variable,
  "playfair-display": playfairDisplay.variable,
  "cormorant-garamond": cormorantGaramond.variable,
  lora: lora.variable,
  merriweather: merriweather.variable,
  "source-serif-4": sourceSerif4.variable,
  "libre-baskerville": libreBaskerville.variable,
  "bebas-neue": bebasNeue.variable,
  "abril-fatface": abrilFatface.variable,
  oswald: oswald.variable,
  pacifico: pacifico.variable,
  caveat: caveat.variable,
  "fjalla-one": fjallaOne.variable,
  spectral: spectral.variable,
};

function isFontKey(value: string): value is FontKey {
  return value in fontVariablesByKey;
}

export function getFontVariablesClassName(
  fontKeys: string | readonly string[] | null | undefined,
): string {
  const rawKeys = Array.isArray(fontKeys) ? fontKeys : [fontKeys];
  const keys = Array.from(new Set(rawKeys.filter(Boolean))).filter(isFontKey);

  if (keys.length === 0) {
    return inter.variable;
  }

  return keys.map((key) => fontVariablesByKey[key]).join(" ");
}

export const allFontVariablesClassName = [
  inter.variable,
  manrope.variable,
  plusJakartaSans.variable,
  dmSans.variable,
  outfit.variable,
  sora.variable,
  urbanist.variable,
  spaceGrotesk.variable,
  playfairDisplay.variable,
  cormorantGaramond.variable,
  lora.variable,
  merriweather.variable,
  sourceSerif4.variable,
  libreBaskerville.variable,
  bebasNeue.variable,
  abrilFatface.variable,
  oswald.variable,
  pacifico.variable,
  caveat.variable,
  fjallaOne.variable,
  spectral.variable,
].join(" ");
