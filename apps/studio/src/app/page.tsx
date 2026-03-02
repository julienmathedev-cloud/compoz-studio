/**
 * @file apps/studio/app/page.tsx
 * @layer app/studio/page
 *
 * @description
 * Root studio : redirection vers la locale par défaut.
 */

import { redirect } from "next/navigation";

const DEFAULT_LOCALE = "fr" as const;

export default function StudioRootPage() {
  redirect(`/${DEFAULT_LOCALE}`);
}
