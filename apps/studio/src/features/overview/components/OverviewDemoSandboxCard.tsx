"use client";

/**
 * @file apps/studio/src/features/overview/components/OverviewDemoSandboxCard.tsx
 * @layer studio/features/overview/components
 *
 * @description
 * Informational Overview card shown when the current Studio session is a demo sandbox.
 *
 * @remarks
 * - Reads copy from `next-intl`; all messaging stays translation-driven.
 * - Keeps the sandbox notice separate from regular overview metrics and actions.
 */

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Card, CardContent, CardHeader } from "@compoz/ui/components/ui/card";
import { cn } from "@compoz/ui/lib/utils";

type OverviewDemoSandboxCardProps = Readonly<{
  className?: string;
}>;

export function OverviewDemoSandboxCard({
  className,
}: OverviewDemoSandboxCardProps) {
  const t = useTranslations();

  return (
    <Card variant="panel" visualMode="studio" className={className}>
      <CardHeader className="flex flex-row items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            "bg-primary/10 text-primary",
          )}
          aria-hidden="true"
        >
          <Sparkles className="size-5" />
        </div>

        <div className="space-y-1">
          <Heading as="h3">
            {t("studio.overviewSection.demoSandbox.title")}
          </Heading>

          <Text as="p" variant="muted">
            {t("studio.overviewSection.demoSandbox.description")}
          </Text>
        </div>
      </CardHeader>

      <CardContent className="pl-17">
        <Text as="p" variant="muted">
          {t("studio.overviewSection.demoSandbox.note")}
        </Text>
      </CardContent>
    </Card>
  );
}

OverviewDemoSandboxCard.displayName = "OverviewDemoSandboxCard";
