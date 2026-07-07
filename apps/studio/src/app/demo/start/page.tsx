/**
 * @file apps/studio/src/app/demo/start/page.tsx
 * @layer studio/app
 *
 * @description
 * Public intermediary page that starts the demo sandbox flow.
 */

import { DemoStartLoader } from "@compoz/studio/features/demo/DemoStartLoader";

export default function DemoStartPage() {
  return <DemoStartLoader />;
}
