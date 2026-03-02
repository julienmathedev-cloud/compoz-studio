"use client";

/**
 * @file apps/studio/src/features/settings/menus/MenuPage.tsx
 * @layer ui/pages
 *
 * @description
 * Page “Menus” (admin) — conteneur des sections menu principal et menu légal.
 *
 * @remarks
 * - Agrège l’état `dirty` des sections (Primary + Legal) pour le guard/navigation.
 * - UI-only : aucune logique métier.
 */

import { Separator } from "@compoz/ui/components/ui/separator";
import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { useAdminDirtyGuard } from "@compoz/studio/features/dirty-guard/useAdminDirtyGuard";
import { LegalMenuSection } from "@compoz/studio/features/settings/menus/legal-menu/LegalMenuSection";
import { PrimaryMenuSection } from "@compoz/studio/features/settings/menus/primary-menu/PrimaryMenuSection";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Page Menus : agrège l’état dirty des sections (admin).
 */
export function MenuPage() {
  const t = useTranslations();
  const dirtyGuard = useAdminDirtyGuard();

  const [primaryDirty, setPrimaryDirty] = useState(false);
  const [legalDirty, setLegalDirty] = useState(false);

  const aggregatedDirty = useMemo(
    () => primaryDirty || legalDirty,
    [primaryDirty, legalDirty],
  );

  const onPrimaryDirtyChange = useCallback((dirty: boolean) => {
    setPrimaryDirty(dirty);
  }, []);

  const onLegalDirtyChange = useCallback((dirty: boolean) => {
    setLegalDirty(dirty);
  }, []);

  // ✅ Side-effect propre : synchronise le dirty guard avec l’état agrégé
  useEffect(() => {
    dirtyGuard.setDirty(aggregatedDirty);
  }, [dirtyGuard, aggregatedDirty]);

  return (
    <div className={cn(ADMIN_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("admin.shared.entities.menus")}
      </Heading>
      <PrimaryMenuSection onDirtyChange={onPrimaryDirtyChange} />
      <Separator />
      <LegalMenuSection onDirtyChange={onLegalDirtyChange} />
    </div>
  );
}

MenuPage.displayName = "MenuPage";
