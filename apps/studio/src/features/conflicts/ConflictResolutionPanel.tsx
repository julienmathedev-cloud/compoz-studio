"use client";

/**
 * @file apps/studio/src/features/conflicts/ConflictResolutionPanel.tsx
 * @layer studio/features/conflicts
 * @description Shared accessible presentation shell for Studio OCC conflicts.
 */

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { conflictPresentationStatusKey } from "@compoz/studio/features/conflicts/conflict-presentation";
import type {
  ConflictActionExecutionResult,
  ConflictDisplayValue,
  ConflictPresentationGroup,
  ConflictResolutionChoice,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  conflictItemDomIdentity,
  getFirstRequiredConflictChoiceId,
  executeConflictAction,
  scheduleConflictFocus,
} from "@compoz/studio/features/conflicts/conflict-focus";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@compoz/ui/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@compoz/ui/components/ui/field";

type ConflictResolutionPanelProps = Readonly<{
  conflictId: string;
  title: string;
  description: string;
  groups: readonly ConflictPresentationGroup[];
  labels: Readonly<{
    baseline: string;
    server: string;
    local: string;
    useServer: string;
    keepLocal: string;
    pending: string;
  }>;
  pending?: boolean;
  error?: string;
  onChoice?: (itemId: string, choice: ConflictResolutionChoice) => void;
  renderItemActions?: (itemId: string) => ReactNode;
  actions?: readonly Readonly<{
    id: string;
    label: string;
    variant?: "default" | "outline" | "ghost" | "destructive";
    disabled?: boolean;
    onClick: () => ConflictActionExecutionResult | Promise<ConflictActionExecutionResult>;
    focusAfterSuccess?: "restore-trigger" | "panel" | "target" | "none";
    focusTargetId?: string;
  }>[];
}>;

function displayValue(value: ConflictDisplayValue): string {
  return value.kind === "list" ? value.items.join(" · ") : value.text;
}

export function ConflictResolutionPanel({
  conflictId,
  title,
  description,
  groups,
  labels,
  pending = false,
  error,
  onChoice,
  renderItemActions,
  actions = [],
}: ConflictResolutionPanelProps) {
  const titleId = useId();
  const t = useTranslations("studio.conflictResolution");
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousConflictId = useRef<string | null>(null);
  const previousFocusChoiceId = useRef<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const firstRequiredChoiceId = getFirstRequiredConflictChoiceId(groups);

  useEffect(() => {
    const isNewConflict = previousConflictId.current !== conflictId;
    const shouldMoveFocus = isNewConflict || previousFocusChoiceId.current !== firstRequiredChoiceId;
    if (!shouldMoveFocus) return;

    if (isNewConflict) {
      previousConflictId.current = conflictId;
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    previousFocusChoiceId.current = firstRequiredChoiceId;

    const required = firstRequiredChoiceId
      ? panelRef.current?.querySelector<HTMLInputElement>(`input[data-conflict-choice-id="${conflictItemDomIdentity(conflictId, firstRequiredChoiceId).firstChoiceToken}"]:not(:disabled)`)
      : null;
    (required ?? panelRef.current)?.focus();
  }, [conflictId, firstRequiredChoiceId]);

  const restoreFocus = () => {
    const trigger = triggerRef.current;
    scheduleConflictFocus({
      getTarget: () => trigger ? {
        isConnected: trigger.isConnected,
        disabled: "disabled" in trigger && trigger.disabled === true,
        ariaDisabled: trigger.getAttribute("aria-disabled"),
        hidden: trigger.hidden,
        hasFocusMethod: typeof trigger.focus === "function",
        focus: () => trigger.focus(),
      } : null,
    });
  };

  const focusStableTarget = (targetId: string | undefined) => {
    if (!targetId) return;
    scheduleConflictFocus({
      getTarget: () => {
        const target = document.getElementById(targetId);
        return target ? {
          isConnected: target.isConnected,
          disabled: "disabled" in target && target.disabled === true,
          ariaDisabled: target.getAttribute("aria-disabled"),
          hidden: target.hidden,
          hasFocusMethod: typeof target.focus === "function",
          focus: () => target.focus(),
        } : null;
      },
    });
  };

  return (
    <Card variant="panel" visualMode="studio">
      <div
      aria-busy={pending}
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="outline-none"
      ref={panelRef}
      role="region"
      tabIndex={-1}
    >
      <CardHeader>
        <CardTitle id={titleId}>{title}</CardTitle>
        <p className="text-sm text-muted-foreground" id={descriptionId}>{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map((group) => (
          <section aria-label={group.label} className="space-y-3" key={group.id}>
            {group.label ? <p className="font-medium">{group.label}</p> : null}
            {group.items.map((item) => {
              const domIdentity = conflictItemDomIdentity(conflictId, item.id);
              return (
              <div className="rounded-md border p-3" data-conflict-item={item.id} key={item.id}>
                <p className="font-medium">{item.label}</p>
                {item.context ? <p className="text-sm text-muted-foreground">{item.context}</p> : null}
                <FieldDescription id={domIdentity.statusId} visualMode="studio">
                  {t(`status.${conflictPresentationStatusKey(item)}`)}
                </FieldDescription>
                {item.comparison ? <dl className="mt-2 grid gap-1 text-sm">
                  <div><dt className="inline font-medium">{labels.baseline}: </dt><dd className="inline">{displayValue(item.comparison.baseline)}</dd></div>
                  <div><dt className="inline font-medium">{labels.server}: </dt><dd className="inline">{displayValue(item.comparison.server)}</dd></div>
                  <div><dt className="inline font-medium">{labels.local}: </dt><dd className="inline">{displayValue(item.comparison.local)}</dd></div>
                </dl> : null}
                {item.details?.length ? (
                  <dl className="mt-2 grid gap-1 text-sm">
                    {item.details.map((detail) => (
                      <div key={detail.id}>
                        <dt className="inline font-medium">{detail.label}: </dt>
                        <dd className="inline">{displayValue(detail.value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {item.resolutionMode === "choice" ? (
                  <FieldSet aria-describedby={domIdentity.statusId} className="mt-3" disabled={pending}>
                    <FieldLegend className="sr-only">{item.label}</FieldLegend>
                    <div className="flex flex-wrap gap-3">
                      <Field orientation="horizontal">
                        <FieldLabel visualMode="studio">
                          <input checked={item.choice === "server"} data-conflict-choice-id={domIdentity.firstChoiceToken} name={domIdentity.radioName} onChange={() => onChoice?.(item.id, "server")} type="radio" />
                          {labels.useServer}
                        </FieldLabel>
                      </Field>
                      <Field orientation="horizontal">
                        <FieldLabel visualMode="studio">
                          <input checked={item.choice === "local"} name={domIdentity.radioName} onChange={() => onChoice?.(item.id, "local")} type="radio" />
                          {labels.keepLocal}
                        </FieldLabel>
                      </Field>
                    </div>
                  </FieldSet>
                ) : null}
                {renderItemActions?.(item.id)}
              </div>
              );
            })}
          </section>
        ))}
        {pending ? <FieldDescription aria-live="polite" role="status" visualMode="studio">{labels.pending || t("pending")}</FieldDescription> : null}
        {error ? <FieldError aria-live="assertive">{error}</FieldError> : null}
        {actions.length > 0 ? <div className="flex flex-wrap gap-2">{actions.map((action) => (
          <Button disabled={pending || action.disabled} key={action.id} onClick={() => { void executeConflictAction(action.onClick, (unexpectedError) => { console.error("Unexpected conflict action failure", unexpectedError); }).then((result) => { if (result.status !== "success") return; if (action.focusAfterSuccess === "restore-trigger") restoreFocus(); if (action.focusAfterSuccess === "panel") panelRef.current?.focus(); if (action.focusAfterSuccess === "target") focusStableTarget(action.focusTargetId); }); }} type="button" variant={action.variant}>
            {action.label}
          </Button>
        ))}</div> : null}
      </CardContent>
      </div>
    </Card>
  );
}

ConflictResolutionPanel.displayName = "ConflictResolutionPanel";
