/**
 * @file apps/studio/src/components/molecules/feedback/EmptyState.tsx
 * @layer studio/molecules
 *
 * @description
 * Generic Studio empty state for optional icon and text feedback.
 *
 * @remarks
 * - Composes `StudioIcon`, `Text`, and the shared `Empty` primitive.
 * - Provides non-blocking feedback for lists or sections without content.
 */

import type { StudioIconProps } from "@compoz/studio/components/atoms/StudioIcon";
import { StudioIcon } from "@compoz/studio/components/atoms/StudioIcon";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Empty, EmptyDescription } from "@compoz/ui/components/ui/empty";
import { cn } from "@compoz/ui/lib/utils";

type EmptyStateProps = Readonly<{
  text?: string;
  icon?: StudioIconProps["icon"];
  className?: string;
}>;
export function EmptyState({ text, icon, className }: EmptyStateProps) {
  return (
    <Empty className={cn(className)} visualMode="studio">
      <EmptyDescription>
        {icon && <StudioIcon icon={icon} />}

        {text && (
          <Text as="span" variant="muted" className="text-center">
            {text}
          </Text>
        )}
      </EmptyDescription>
    </Empty>
  );
}

EmptyState.displayName = "EmptyState";
