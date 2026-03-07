/**
 * @file apps/studio/src/i18n/navigation.ts
 * @layer studio/i18n
 * @description
 * Helpers de navigation i18n pour le Studio.
 *
 * Wrappers de `next-intl/navigation` préconfigurés avec le routing du Studio
 * afin de conserver automatiquement la locale lors de la navigation.
 */

import { routing } from "@compoz/studio/i18n/routing";
import { createNavigation } from "next-intl/navigation";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
