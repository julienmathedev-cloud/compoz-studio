/**
 * @file packages/ui/src/site/providers/SiteThemeBoundary.tsx
 * @layer ui/site/providers
 *
 * @description
 * Applies the published public site theme on the server without a client context provider.
 */

import type { CSSProperties, ReactNode } from "react";

import { themeSettingsToCssVars } from "@compoz/ui/settings/theme/theme-css-vars";
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
        fontFamily: "var(--website-font-body)",
      } satisfies CSSProperties)
    : undefined;

  const className =
    resolvedTheme?.enableDarkMode && resolvedTheme.mode === "dark"
      ? "dark"
      : undefined;

  return (
    <div data-site-theme-boundary className={className} style={style}>
      {children}
    </div>
  );
}

SiteThemeBoundary.displayName = "SiteThemeBoundary";
