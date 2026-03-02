/**
 * @file apps/studio/src/app/[locale]/dashboard/(settings)/identity/page.tsx
 * @layer app/studio/pages
 *
 * @description
 * Page admin “Identity” (V0.5) : affiche la section Identity.
 */
import { IdentityPage } from "@compoz/studio/features/settings/identity/IdentityPage";

export default function AdminIdentityPage() {
  return <IdentityPage />;
}

AdminIdentityPage.displayName = "AdminIdentityPage";
