/**
 * @file apps/studio/src/app/page.tsx
 * @layer studio/app
 *
 * @description
 * Studio root page that redirects to the default locale defined by i18n routing.
 */

import { routing } from "@compoz/studio/i18n/routing";
import { redirect } from "next/navigation";

export default function StudioRootPage() {
  redirect(`/${routing.defaultLocale}`);
}
