"use client";

/**
 * @file apps/studio/src/features/pages/blocks/BlocksSection.tsx
 * @layer studio/features/pages/blocks
 *
 * @description
 * Placeholder Studio Blocks section shown until the block library is available.
 *
 * @remarks
 * - Keeps the Dashboard route present while the block library feature is not implemented yet.
 * - Renders a visible section heading through `SettingsSection`.
 */

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";

export function BlocksSection() {
  return (
    <SettingsSection
      id="blocks"
      title="Blocs — bientôt disponible"
      description="Section du studio pour la bibliothèque de blocs du site."
    >
      <Text as="p">
        La bibliothèque de blocs sera disponible dans une prochaine version.
      </Text>
    </SettingsSection>
  );
}

BlocksSection.displayName = "BlocksSection";
