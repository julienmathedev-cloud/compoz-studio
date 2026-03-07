"use client";

/**
 * @file apps/studio/src/features/pages/blocks/sections/BlocksSection.tsx
 * @layer ui/studio/pages/blocks/sections
 *
 * @description
 * Section « Blocs » du studio — placeholder UI en attente de la bibliothèque de blocs.
 *
 * @remarks
 * - Sert de repère visuel dans le Dashboard tant que la fonctionnalité n’est pas disponible.
 * - Ne contient aucune logique métier ni orchestration.
 * - Strictement UI-only.
 */

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";

/**
 * Section placeholder pour l’onglet « Blocs » (studio).
 */
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
