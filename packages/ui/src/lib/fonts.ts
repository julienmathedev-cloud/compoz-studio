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

export const fontVariablesClassName = [
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
].join(" ");
