/**
 * @file apps/studio/src/app/[locale]/(dashboard)/(settings)/menu/page.tsx
 * @layer studio/app
 *
 * @description
 * Studio Dashboard route that delegates menu settings to `MenuPage`.
 */

import { MenuPage } from "@compoz/studio/features/settings/menus/MenuPage";

export default function StudioMenuPage() {
  return <MenuPage />;
}

StudioMenuPage.displayName = "StudioMenuPage";
