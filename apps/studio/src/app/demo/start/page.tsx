/**
 * @file apps/studio/src/app/demo/start/page.tsx
 * @layer studio/app
 *
 * @description
 * Page publique intermédiaire de démarrage de la sandbox démo.
 */

import { DemoStartLoader } from "@compoz/studio/features/demo/DemoStartLoader";

export default function DemoStartPage() {
  return <DemoStartLoader />;
}
