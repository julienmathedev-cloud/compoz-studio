"use client";

/**
 * @file apps/studio/src/features/preview/PreviewFrame.tsx
 * @layer ui/preview
 *
 * @description
 * Iframe de preview réutilisable (admin) avec toolbar (device, sync/reset).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import {
  ADMIN_SHADOW_PANEL,
  ROW_BETWEEN,
  ROW_CENTER,
  STACK_SM,
} from "@compoz/ui/styles/studio/layout";

import {
  Monitor,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Tablet,
} from "lucide-react";
import { TooltipButton } from "@compoz/studio/components/atoms/buttons/TooltipButton";
import { SectionLoader } from "@compoz/studio/components/loading/SectionLoader";

export type PreviewDevice =
  | "mobile"
  | "tablet"
  | "laptop"
  | "desktop"
  | "wqhd"
  | "uhd";

type PreviewFitMode = "responsive" | "scale";

type PreviewFrameProps = Readonly<{
  title: string;
  src: string;

  onSync?: () => void | Promise<void>;
  onReset?: () => void | Promise<void>;

  syncDisabled?: boolean;
  isBusy?: boolean;
  isLoading?: boolean;

  info?: ReactNode;

  heightClassName?: string;
  defaultDevice?: PreviewDevice;

  sandbox?: string;
  iframeRef?: RefObject<HTMLIFrameElement | null>;
  onLoad?: () => void;

  /** Si true, l'iframe pointe vers une route empty générique */
  isEmpty?: boolean;

  /** Label affiché dans l'empty preview */
  emptyLabel?: string;

  deviceMode?: "compact" | "full";
  className?: string;
  fitMode?: PreviewFitMode;
}>;

const DEVICE_PRESETS: Readonly<Record<PreviewDevice, { width: number }>> = {
  mobile: { width: 640 },
  tablet: { width: 780 },
  laptop: { width: 1028 },
  desktop: { width: 1280 },
  wqhd: { width: 1536 },
  uhd: { width: 1920 },
} as const;

const COMPACT_DEVICES: readonly PreviewDevice[] = [
  "desktop",
  "tablet",
  "mobile",
] as const;

const DEVICE_ICON: Readonly<Record<PreviewDevice, ReactNode>> = {
  desktop: <Monitor aria-hidden="true" />,
  tablet: <Tablet aria-hidden="true" />,
  mobile: <Smartphone className="scale-90" aria-hidden="true" />,
  laptop: <Monitor aria-hidden="true" />,
  wqhd: <Monitor aria-hidden="true" />,
  uhd: <Monitor aria-hidden="true" />,
} as const;

export function PreviewFrame({
  title,
  src,
  onSync,
  onReset,
  syncDisabled,
  isBusy,
  isLoading,
  info,
  heightClassName = "h-[420px]",
  defaultDevice = "desktop",
  sandbox,
  iframeRef,
  onLoad,
  isEmpty,
  emptyLabel,
  deviceMode = "compact",
  className,
  fitMode = "responsive",
}: PreviewFrameProps) {
  const innerRef = useRef<HTMLIFrameElement | null>(null);
  const ref = iframeRef ?? innerRef;

  const t = useTranslations();

  const availableDevices = useMemo<readonly PreviewDevice[]>(() => {
    return deviceMode === "compact"
      ? COMPACT_DEVICES
      : (Object.keys(DEVICE_PRESETS) as PreviewDevice[]);
  }, [deviceMode]);

  const [device, setDevice] = useState<PreviewDevice>(() => {
    return availableDevices.includes(defaultDevice) ? defaultDevice : "desktop";
  });

  const resolvedDevice = useMemo<PreviewDevice>(() => {
    return availableDevices.includes(device) ? device : "desktop";
  }, [availableDevices, device]);

  const deviceWidth = useMemo(
    () => DEVICE_PRESETS[resolvedDevice].width,
    [resolvedDevice],
  );

  // ✅ Résolution du src final (empty route si nécessaire)
  const resolvedSrc = useMemo(() => {
    if (!isEmpty) return src;

    // On passe le texte via querystring (SSR-safe).
    const label = (emptyLabel ?? "").trim();
    if (!label) return "/preview/empty";

    const qs = new URLSearchParams({ label });
    return `/preview/empty?${qs.toString()}`;
  }, [src, isEmpty, emptyLabel]);

  // Mesure de la largeur disponible (container).
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setAvailableWidth(Number.isFinite(w) ? w : null);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const frameWidth = useMemo(() => {
    const available = availableWidth ?? deviceWidth;

    if (fitMode === "scale") return deviceWidth;

    return Math.max(320, Math.min(deviceWidth, available));
  }, [availableWidth, deviceWidth, fitMode]);

  const scale = useMemo(() => {
    if (fitMode !== "scale") return 1;
    const available = availableWidth ?? deviceWidth;
    const next = Math.min(1, available / deviceWidth);
    return Number.isFinite(next) ? next : 1;
  }, [availableWidth, deviceWidth, fitMode]);

  const handleSync = useCallback(() => onSync?.(), [onSync]);
  const handleReset = useCallback(() => onReset?.(), [onReset]);

  const uiDisabled = Boolean(isBusy || isLoading);

  return (
    <section className={cn(STACK_SM)} aria-label={title}>
      <Heading as="h2">{title}</Heading>

      <div className={cn(ROW_BETWEEN, "flex-wrap gap-2")}>
        <Text>{t("admin.shared.preview.navDisabled")}</Text>

        <Card className={cn(ADMIN_SHADOW_PANEL, "p-0 shadow-accent")}>
          <CardContent className={cn(ROW_CENTER, "gap-1 p-1")}>
            {availableDevices.map((k, index) => {
              const deviceLabel = t(`admin.previewFrame.devices.${k}`);
              const isActive = resolvedDevice === k;

              return (
                <Button
                  key={toStableUiKey({ keyId: k, label: deviceLabel }, index)}
                  type="button"
                  size="icon"
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => setDevice(k)}
                  disabled={uiDisabled}
                  aria-label={deviceLabel}
                  title={deviceLabel}
                >
                  {deviceMode === "compact" ? (
                    DEVICE_ICON[k]
                  ) : (
                    <span>{deviceLabel}</span>
                  )}
                </Button>
              );
            })}

            {onReset || onSync ? (
              <Separator orientation="vertical" className="h-10" />
            ) : null}

            {onReset ? (
              <TooltipButton
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleReset}
                disabled={uiDisabled}
                tooltip={t("common.reset")}
                aria-label={t("common.reset")}
              >
                <RotateCcw aria-hidden="true" />
              </TooltipButton>
            ) : null}

            {onSync ? (
              <TooltipButton
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleSync}
                disabled={uiDisabled || Boolean(syncDisabled)}
                tooltip={t("common.sync")}
                aria-label={t("common.sync")}
              >
                <RefreshCw aria-hidden="true" />
              </TooltipButton>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {info ? <Text variant="meta">{info}</Text> : null}

      <div className={cn("bg-background w-full")}>
        <div ref={containerRef} className={cn("flex justify-center")}>
          <div
            className="relative"
            style={{
              width: fitMode === "scale" ? deviceWidth * scale : frameWidth,
            }}
          >
            <div
              className={cn(
                "shadow-xs shadow-accent overflow-hidden",
                "relative",
                "origin-top-left",
                "outline rounded-xl outline-border",
              )}
              style={{
                width: fitMode === "scale" ? deviceWidth : frameWidth,
                transform: fitMode === "scale" ? `scale(${scale})` : undefined,
                transformOrigin: "top left",
              }}
            >
              <iframe
                key={resolvedSrc} // ✅ important pour forcer reload quand on switch empty/normal
                ref={(node) => {
                  if (ref && "current" in ref) ref.current = node;
                }}
                title={title}
                tabIndex={-1}
                src={resolvedSrc}
                sandbox={sandbox}
                onLoad={onLoad}
                style={{
                  width: fitMode === "scale" ? deviceWidth : frameWidth,
                }}
                className={cn(
                  "block",
                  heightClassName,
                  className,
                  isLoading ? "invisible" : "visible",
                )}
              />

              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-card">
                  <SectionLoader label={t("admin.shared.loading.preview")} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

PreviewFrame.displayName = "PreviewFrame";
