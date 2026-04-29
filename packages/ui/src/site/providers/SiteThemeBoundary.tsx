/**
 * @file packages/ui/src/site/providers/SiteThemeBoundary.tsx
 * @layer ui/site/providers
 *
 * @description
 * Boundary SSR appliquant le thème publié du site public sans contexte client.
 */

import type { CSSProperties, ReactNode } from "react";

import { themeSettingsToCssVars } from "@compoz/ui/settings/theme/theme-css-vars";
import { resolveThemeFontFamily } from "@compoz/ui/settings/theme/theme-font-runtime";
import type { ThemeSettingsShape } from "@compoz/validation/site/settings/theme/theme";

export type SiteThemeBoundaryProps = Readonly<{
  theme: ThemeSettingsShape | null | undefined;
  children: ReactNode;
}>;

export function SiteThemeBoundary({ theme, children }: SiteThemeBoundaryProps) {
  const resolvedTheme = theme ?? null;

  const style = resolvedTheme
    ? ({
        ...(themeSettingsToCssVars(resolvedTheme) as CSSProperties),
        fontFamily: resolveThemeFontFamily(resolvedTheme.fontFamily),
      } satisfies CSSProperties)
    : undefined;

  const className =
    resolvedTheme?.enableDarkMode && resolvedTheme.mode === "dark"
      ? "dark"
      : undefined;

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

SiteThemeBoundary.displayName = "SiteThemeBoundary";
