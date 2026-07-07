/**
 * @file apps/studio/src/i18n/navigation.ts
 * @layer studio/i18n
 *
 * @description
 * Studio i18n navigation helpers.
 *
 * @remarks
 * - Wraps `next-intl/navigation` with Studio routing so generated navigation helpers preserve the active locale.
 */

import { routing } from "@compoz/studio/i18n/routing";
import { createNavigation } from "next-intl/navigation";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
