/**
 * @file apps/studio/app/page.tsx
 * @layer studio/app
 *
 * @description
 * Root Studio : redirige vers la locale par défaut définie dans le routing i18n.
 */

import { routing } from "@compoz/studio/i18n/routing";
import { redirect } from "next/navigation";

export default function StudioRootPage() {
  redirect(`/${routing.defaultLocale}`);
}
