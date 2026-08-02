"use client";

/**
 * @file apps/studio/src/features/conflicts/ConflictResolutionPanel.tsx
 * @layer studio/features/conflicts
 * @description Single interactive panel for every Studio OCC conflict.
 */

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  canApplyConflictResolution,
  conflictPresentationStatusKey,
  toDecisionConflictChoices,
  toDecisionConflictGroups,
  type ConflictActionExecutionResult,
  type ConflictDisplayValue,
  type ConflictPresentationGroup,
  type ConflictResolutionChoice,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  conflictItemDomIdentity,
  executeConflictAction,
  getFirstRequiredConflictChoiceId,
  scheduleConflictFocus,
} from "@compoz/studio/features/conflicts/conflict-focus";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@compoz/ui/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@compoz/ui/components/ui/field";

export type ConflictResolutionChoices = Readonly<
  Record<string, ConflictResolutionChoice>
>;

type ConflictResolutionPanelProps = Readonly<{
  conflictKey: string;
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
    cancel: string;
    apply: string;
  }>;
  isPending?: boolean;
  error?: string;
  focusTargetId?: string;
  onCancel: () => ConflictActionExecutionResult | Promise<ConflictActionExecutionResult>;
  onApply: (
    choices: ConflictResolutionChoices,
  ) => ConflictActionExecutionResult | Promise<ConflictActionExecutionResult>;
}>;

function displayValue(value: ConflictDisplayValue): string {
  return value.kind === "list" ? value.items.join(" · ") : value.text;
}

export function ConflictResolutionPanel({
  conflictKey,
  title,
  description,
  groups,
  labels,
  isPending = false,
  error,
  focusTargetId,
  onCancel,
  onApply,
}: ConflictResolutionPanelProps) {
  const titleId = useId();
  const descriptionId = useId();
  const t = useTranslations("studio.conflictResolution");
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const previousConflictKeyRef = useRef<string | null>(null);
  const actionPendingRef = useRef(false);
  const mountedRef = useRef(true);
  const [selection, setSelection] = useState<Readonly<{
    conflictKey: string;
    choices: Record<string, ConflictResolutionChoice>;
  }>>({ conflictKey, choices: {} });
  const [actionState, setActionState] = useState<Readonly<{
    conflictKey: string;
    pending: boolean;
  }>>({ conflictKey, pending: false });
  const choices = selection.conflictKey === conflictKey ? selection.choices : {};
  const actionPending = actionState.conflictKey === conflictKey && actionState.pending;
  const pending = isPending || actionPending;
  const decisionGroups = toDecisionConflictGroups(groups);
  const decisionChoices = toDecisionConflictChoices(decisionGroups, choices);
  const canApply = decisionGroups.length > 0 &&
    canApplyConflictResolution(decisionGroups, pending, decisionChoices);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const isNewConflict = previousConflictKeyRef.current !== conflictKey;
    if (!isNewConflict) return;
    previousConflictKeyRef.current = conflictKey;
    triggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    actionPendingRef.current = false;

    queueMicrotask(() => {
      if (!mountedRef.current) return;
      const firstRequiredId = getFirstRequiredConflictChoiceId(
        decisionGroups,
        decisionChoices,
      );
      const firstChoice = firstRequiredId
        ? conflictItemDomIdentity(conflictKey, firstRequiredId).firstChoiceToken
        : null;
      const input = firstChoice
        ? panelRef.current?.querySelector<HTMLInputElement>(
            `input[data-conflict-choice-id="${firstChoice}"]:not(:disabled)`,
          )
        : null;
      (input ?? panelRef.current)?.focus();
    });
  }, [conflictKey, decisionChoices, decisionGroups]);

  const restoreTriggerFocus = () => {
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

  const focusStableTarget = () => {
    if (!focusTargetId) return;
    scheduleConflictFocus({
      getTarget: () => {
        const target = document.getElementById(focusTargetId);
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

  const runAction = async (
    action: () => ConflictActionExecutionResult | Promise<ConflictActionExecutionResult>,
    onSuccess: () => void,
  ) => {
    if (pending || actionPendingRef.current) return;
    actionPendingRef.current = true;
    setActionState({ conflictKey, pending: true });
    const result = await executeConflictAction(action, (unexpectedError) => {
      console.error("Unexpected conflict action failure", unexpectedError);
    });
    if (mountedRef.current) setActionState({ conflictKey, pending: false });
    actionPendingRef.current = false;
    if (result.status === "success") onSuccess();
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
          <p className="text-sm text-muted-foreground" id={descriptionId}>
            {description}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {decisionGroups.map((group) => (
            <section aria-label={group.label} className="space-y-3" key={group.id}>
              {group.label ? <p className="font-medium">{group.label}</p> : null}
              {group.items.map((item) => {
                const domIdentity = conflictItemDomIdentity(conflictKey, item.id);
                const itemChoice = decisionChoices[item.id];
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
                    <FieldSet aria-describedby={domIdentity.statusId} className="mt-3" disabled={pending}>
                      <FieldLegend className="sr-only">{item.label}</FieldLegend>
                      <div className="flex flex-wrap gap-3">
                        <Field orientation="horizontal">
                          <FieldLabel visualMode="studio">
                            <input
                              checked={itemChoice === "server"}
                              data-conflict-choice-id={domIdentity.firstChoiceToken}
                              name={domIdentity.radioName}
                              onChange={() => setSelection((current) => ({
                                conflictKey,
                                choices: {
                                  ...(current.conflictKey === conflictKey ? current.choices : {}),
                                  [item.id]: "server",
                                },
                              }))}
                              type="radio"
                            />
                            {item.options?.server ?? labels.useServer}
                          </FieldLabel>
                        </Field>
                        <Field orientation="horizontal">
                          <FieldLabel visualMode="studio">
                            <input
                              checked={itemChoice === "local"}
                              name={domIdentity.radioName}
                              onChange={() => setSelection((current) => ({
                                conflictKey,
                                choices: {
                                  ...(current.conflictKey === conflictKey ? current.choices : {}),
                                  [item.id]: "local",
                                },
                              }))}
                              type="radio"
                            />
                            {item.options?.local ?? labels.keepLocal}
                          </FieldLabel>
                        </Field>
                      </div>
                    </FieldSet>
                  </div>
                );
              })}
            </section>
          ))}
          {pending ? <FieldDescription aria-live="polite" role="status" visualMode="studio">{labels.pending}</FieldDescription> : null}
          {error ? <FieldError aria-live="assertive">{error}</FieldError> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              aria-disabled={pending}
              disabled={pending}
              onClick={() => { void runAction(onCancel, restoreTriggerFocus); }}
              type="button"
              variant="outline"
            >
              {labels.cancel}
            </Button>
            <Button
              aria-disabled={!canApply}
              disabled={!canApply}
              onClick={() => { void runAction(() => onApply({ ...decisionChoices }), focusStableTarget); }}
              type="button"
            >
              {labels.apply}
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

ConflictResolutionPanel.displayName = "ConflictResolutionPanel";
