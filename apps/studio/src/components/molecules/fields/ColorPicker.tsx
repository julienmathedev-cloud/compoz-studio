"use client";

/**
 * @file apps/studio/src/components/molecules/fields/ColorPicker.tsx
 * @layer studio/molecules/fields
 *
 * @description
 * Low-level HEX color picker with saturation/value surface and hue slider.
 *
 * @remarks
 * - Outputs controlled HEX values only.
 * - Does not support alpha or eyedropper selection.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { Slider } from "@compoz/ui/components/ui/slider";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";

export type ColorPickerProps = Readonly<{
  value: string;
  onChange: (nextHex: string) => void;
  disabled?: boolean;
  className?: string;
}>;

type HsvColor = Readonly<{
  h: number;
  s: number;
  v: number;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(value: string): string {
  const raw = String(value ?? "")
    .trim()
    .replace(/^#/, "")
    .toUpperCase();

  if (!/^[0-9A-F]{3}$|^[0-9A-F]{6}$/.test(raw)) {
    return "#000000";
  }

  if (raw.length === 3) {
    return `#${raw
      .split("")
      .map((char) => char + char)
      .join("")}`;
  }

  return `#${raw}`;
}

function isValidHex(value: string): boolean {
  return /^#([0-9A-F]{6})$/i.test(normalizeHex(value));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex).replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) =>
    clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsv(
  rRaw: number,
  gRaw: number,
  bRaw: number,
): { h: number; s: number; v: number } {
  const r = rRaw / 255;
  const g = gRaw / 255;
  const b = bRaw / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
}

function hsvToRgb(
  hRaw: number,
  sRaw: number,
  vRaw: number,
): { r: number; g: number; b: number } {
  const h = ((hRaw % 360) + 360) % 360;
  const s = clamp(sRaw, 0, 1);
  const v = clamp(vRaw, 0, 1);

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
  } else if (h < 120) {
    rPrime = x;
    gPrime = c;
  } else if (h < 180) {
    gPrime = c;
    bPrime = x;
  } else if (h < 240) {
    gPrime = x;
    bPrime = c;
  } else if (h < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  return {
    r: (rPrime + m) * 255,
    g: (gPrime + m) * 255,
    b: (bPrime + m) * 255,
  };
}

function hexToHsv(hex: string): HsvColor {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsv(r, g, b);
}

function hsvToHex(hsv: HsvColor): string {
  const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v);
  return rgbToHex(r, g, b);
}

export function ColorPicker({
  value,
  onChange,
  disabled = false,
  className,
}: ColorPickerProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  const normalizedValue = useMemo(() => normalizeHex(value), [value]);

  const [internal, setInternal] = useState<HsvColor>(() =>
    hexToHsv(normalizedValue),
  );

  useEffect(() => {
    setInternal(hexToHsv(normalizedValue));
  }, [normalizedValue]);

  const hueColor = useMemo(
    () =>
      hsvToHex({
        h: internal.h,
        s: 1,
        v: 1,
      }),
    [internal.h],
  );

  const handleSurfacePointer = (clientX: number, clientY: number) => {
    if (disabled || !surfaceRef.current) return;

    const rect = surfaceRef.current.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);

    const nextS = rect.width === 0 ? 0 : x / rect.width;
    const nextV = rect.height === 0 ? 0 : 1 - y / rect.height;

    const next = {
      h: internal.h,
      s: clamp(nextS, 0, 1),
      v: clamp(nextV, 0, 1),
    };

    setInternal(next);
    onChange(hsvToHex(next));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    handleSurfacePointer(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if ((event.buttons & 1) !== 1) return;

    handleSurfacePointer(event.clientX, event.clientY);
  };

  return (
    <div className={cn(STACK_SM, className)}>
      <div
        ref={surfaceRef}
        className={cn(
          "relative h-52 w-full overflow-hidden rounded-xl border border-border shadow-sm",
          disabled && "pointer-events-none opacity-60",
        )}
        style={{
          backgroundColor: hueColor,
          backgroundImage:
            "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        aria-disabled={disabled || undefined}
      >
        <div
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm ring-1 ring-black/25"
          style={{
            left: `${internal.s * 100}%`,
            top: `${(1 - internal.v) * 100}%`,
          }}
        />
      </div>

      <Slider
        value={[internal.h]}
        min={0}
        max={360}
        step={1}
        disabled={disabled}
        onValueChange={(values) => {
          const nextHue = clamp(values[0] ?? 0, 0, 360);
          const next = { ...internal, h: nextHue };
          setInternal(next);
          onChange(hsvToHex(next));
        }}
        className="w-full"
      />

      <div
        className="h-3 w-full rounded-full border border-border"
        style={{
          background:
            "linear-gradient(90deg, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)",
        }}
      />
    </div>
  );
}

ColorPicker.displayName = "ColorPicker";

export { isValidHex, normalizeHex };
