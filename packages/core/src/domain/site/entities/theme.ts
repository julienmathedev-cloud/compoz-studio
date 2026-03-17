/**
 * @file packages/core/src/domain/site/entities/theme.ts
 * @layer core/domain
 * @description
 * Entité métier représentant la configuration du thème public du site.
 * Définit la forme canonique des données côté domaine, sans logique
 * ni valeurs par défaut (voir `defaults/theme.ts`).
 *
 * @remarks
 * Scope V1 :
 * - activation light/dark
 * - police
 * - reveal
 * - couleurs basées sur les tokens publics
 */

import type { ThemeFontId } from "@compoz/core/constants/theme/theme-fonts";

export type PublicThemeTokens = {
  background: string;
  foreground: string;

  card: string;
  "card-foreground": string;

  popover: string;
  "popover-foreground": string;

  primary: string;
  "primary-foreground": string;

  secondary: string;
  "secondary-foreground": string;

  muted: string;
  "muted-foreground": string;

  accent: string;
  "accent-foreground": string;

  destructive: string;
  "destructive-foreground": string;

  border: string;
  input: string;
  ring: string;
};

/**
 * Mode de thème public disponible en V1.
 *
 * @remarks
 * - `light` : rendu clair forcé
 * - `dark` : rendu sombre forcé
 * - `system` : suit la préférence système si le site l’autorise
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Variante d’animation reveal disponible en V1.
 *
 * @remarks
 * Presets génériques réutilisables par tous les skins publics :
 * - `fade` : apparition douce sans déplacement
 * - `fade-up` : apparition avec légère remontée
 * - `scale-in` : apparition avec léger zoom
 * - `slide-up` : entrée plus marquée depuis le bas
 */
export type RevealPreset = "fade" | "fade-up" | "scale-in" | "slide-up";

/**
 * Entité métier représentant les réglages du thème public.
 */
export interface ThemeSettings {
  /**
   * Active la gestion du thème sombre côté site public.
   *
   * @remarks
   * Si `false`, le site reste sur un rendu clair uniquement.
   */
  enableDarkMode: boolean;

  /**
   * Mode de thème par défaut appliqué au site public.
   */
  mode: ThemeMode;

  /**
   * Police principale utilisée par le site public.
   *
   * @remarks
   * Valeur canonique côté domaine.
   * Référence une police supportée par la source de vérité `theme-fonts`.
   */
  fontFamily: ThemeFontId;

  /**
   * Preset de reveal utilisé par les cellules publiques.
   */
  revealPreset: RevealPreset;

  /**
   * Tokens couleur du thème clair.
   */
  lightTokens: PublicThemeTokens;

  /**
   * Tokens couleur du thème sombre.
   *
   * @remarks
   * Peut être présent même si `enableDarkMode` est `false`,
   * afin de conserver une configuration complète et stable.
   */
  darkTokens: PublicThemeTokens;
}
