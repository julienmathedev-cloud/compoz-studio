/**
 * @file apps/studio/src/app/[locale]/(studio)/layout.tsx
 * @layer app/layout
 *
 * @description
 * Layout principal de l’espace admin : enveloppe globale pour toutes les pages
 * du répertoire `/admin`.
 *
 * @remarks
 * - Contient : Header admin, Footer admin, conteneur central pour les pages,
 *   ConfirmDialogProvider (modales de confirmation).
 * - UI-only : pas de logique métier, pas de fetch.
 * - Version minimale (V0.5) ; pourra évoluer pour intégrer thèmes, panneaux latéraux,
 *   notifications ou autres fonctionnalités UI globales.
 */

import type { ReactNode } from "react";

import { Header } from "@compoz/studio/features/shell/components/Header";
import { AdminSidebar } from "@compoz/studio/components/organisms/AdminSidebar";
import { SidebarInset } from "@compoz/ui/components/ui/sidebar";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_CONTAINER, ADMIN_PAGE } from "@compoz/ui/styles/studio/layout";
import { AdminClientProviders } from "@compoz/studio/app/[locale]/AdminClientProviders";
import { AdminShell } from "@compoz/studio/features/shell/components/AdminShell";
import { Toaster } from "sonner";

type AdminLayoutProps = Readonly<{
  /** Contenu de la page admin courante */
  children: ReactNode;
  params: Promise<
    Readonly<{
      locale: string;
    }>
  >;
}>;

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await unwrapParams(params);

  return (
    <div className="flex h-dvh min-h-0 min-w-0">
      <AdminClientProviders>
        {/* AdminShell : protège les composants sensibles côté client (RHF, Radix Tabs, Dialog, useId, etc.). */}
        <AdminShell>
          {/* Colonne gauche */}
          <aside className="shrink-0">
            <AdminSidebar locale={locale} />
          </aside>

          {/* Colonne droite = tout le contenu “inset” */}
          <SidebarInset className="bg-sidebar flex flex-col min-w-0 min-h-0 h-full">
            {/* Header admin : navigation + skip-link. */}
            <Header />

            {/* Zone principale : contenu des pages tabs. */}
            <main
              id="main"
              className="flex-1 border border-primary/10 bg-background rounded-sm ml-2 md:ml-0 mb-2 mr-2 overflow-y-auto"
              tabIndex={-1}
            >
              <div className={cn(ADMIN_CONTAINER)}>
                <div className={cn(ADMIN_PAGE)}>{children}</div>
              </div>
            </main>

            {/* Toaster local admin. */}
            <Toaster />
          </SidebarInset>
        </AdminShell>
      </AdminClientProviders>
    </div>
  );
}
