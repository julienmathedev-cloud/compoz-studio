"use client";

/**
 * @file apps/studio/src/features/conflicts/ConflictResolutionPanel.tsx
 * @layer studio/features/conflicts
 * @description Single interactive panel for every Studio OCC conflict.
 */

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  canApplyConflictResolution,
  conflictPresentationStatusKey,
  toDecisionConflictChoices,
  toDecisionConflictGroups,
  toManualConflictGroups,
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

export type ConflictResolutionPanelAction =
  | Readonly<{
      kind: "choices";
      onApply: (
        choices: ConflictResolutionChoices,
      ) => ConflictActionExecutionResult | Promise<ConflictActionExecutionResult>;
    }>
  | Readonly<{
      kind: "direct";
      label: string;
      onAction: () => ConflictActionExecutionResult | Promise<ConflictActionExecutionResult>;
    }>
  | Readonly<{ kind: "close-only" }>;

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
    orderBaseline: string;
    orderServer: string;
    orderLocal: string;
    position: string;
  }>;
  action: ConflictResolutionPanelAction;
  isPending?: boolean;
  error?: string;
  focusTargetId?: string;
  onCancel: () => ConflictActionExecutionResult | Promise<ConflictActionExecutionResult>;
}>;

function displayValue(value: ConflictDisplayValue): ReactNode {
  return value.kind === "list" ? (
    <ul className="list-disc space-y-1 pl-5">
      {value.items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  ) : value.text;
}

export function ConflictResolutionPanel({
  conflictKey,
  title,
  description,
  groups,
  labels,
  action,
  isPending = false,
  error,
  focusTargetId,
  onCancel,
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
  const hasGranularChoices = decisionGroups.length > 0;
  const canApply = action.kind === "choices" && hasGranularChoices &&
    canApplyConflictResolution(decisionGroups, pending, decisionChoices);
  const presentationGroups = action.kind === "choices"
    ? decisionGroups
    : action.kind === "direct"
      ? toManualConflictGroups(groups)
      : groups;

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
      const firstRequiredId = action.kind === "choices"
        ? getFirstRequiredConflictChoiceId(decisionGroups, decisionChoices)
        : null;
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
  }, [action.kind, conflictKey, decisionChoices, decisionGroups]);

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
        <CardContent className="mt-2 space-y-4">
          {presentationGroups.map((group) => (
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
                      <div><dt className="inline font-medium">{labels.baseline}: </dt><dd className={item.comparison.baseline.kind === "list" ? "mt-1" : "inline"}>{displayValue(item.comparison.baseline)}</dd></div>
                      <div><dt className="inline font-medium">{labels.server}: </dt><dd className={item.comparison.server.kind === "list" ? "mt-1" : "inline"}>{displayValue(item.comparison.server)}</dd></div>
                      <div><dt className="inline font-medium">{labels.local}: </dt><dd className={item.comparison.local.kind === "list" ? "mt-1" : "inline"}>{displayValue(item.comparison.local)}</dd></div>
                    </dl> : null}
                    {item.orderComparison ? (
                      <div className="mt-3 text-sm">
                        <div className="space-y-3 md:hidden">
                          {([
                            [labels.orderBaseline, item.orderComparison.baseline],
                            [labels.orderServer, item.orderComparison.server],
                            [labels.orderLocal, item.orderComparison.local],
                          ] as const).map(([label, order]) => (
                            <section key={label}>
                              <p className="font-medium">{label}</p>
                              <ol className="list-decimal space-y-1 pl-5">
                                {order.map((value, index) => (
                                  <li key={`${index}-${value}`}>{value}</li>
                                ))}
                              </ol>
                            </section>
                          ))}
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                          <table className="w-full border-collapse text-left">
                            <caption className="sr-only">{item.label}</caption>
                            <thead>
                              <tr>
                                <th className="border-b p-2" scope="col">{labels.position}</th>
                                <th className="border-b p-2" scope="col">{labels.orderBaseline}</th>
                                <th className="border-b p-2" scope="col">{labels.orderServer}</th>
                                <th className="border-b p-2" scope="col">{labels.orderLocal}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({
                                length: Math.max(
                                  item.orderComparison.baseline.length,
                                  item.orderComparison.server.length,
                                  item.orderComparison.local.length,
                                ),
                              }, (_, index) => (
                                <tr key={index}>
                                  <th className="border-b p-2 font-medium" scope="row">{index + 1}</th>
                                  <td className="border-b p-2">{item.orderComparison?.baseline[index] ?? "—"}</td>
                                  <td className="border-b p-2">{item.orderComparison?.server[index] ?? "—"}</td>
                                  <td className="border-b p-2">{item.orderComparison?.local[index] ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                    {item.details?.length ? (
                      <dl className="mt-2 grid gap-1 text-sm">
                        {item.details.map((detail) => (
                          <div key={detail.id}>
                            <dt className="inline font-medium">{detail.label}: </dt>
                            <dd className={detail.value.kind === "list" ? "mt-1" : "inline"}>{displayValue(detail.value)}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {action.kind === "choices" && item.resolutionMode === "choice" ? (
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
                    ) : null}
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
            {action.kind === "choices" && hasGranularChoices ? (
              <Button
                aria-disabled={!canApply}
                disabled={!canApply}
                onClick={() => { void runAction(() => action.onApply({ ...decisionChoices }), focusStableTarget); }}
                type="button"
              >
                {labels.apply}
              </Button>
            ) : null}
            {action.kind === "direct" ? (
              <Button
                aria-disabled={pending}
                disabled={pending}
                onClick={() => { void runAction(action.onAction, focusStableTarget); }}
                type="button"
              >
                {action.label}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

ConflictResolutionPanel.displayName = "ConflictResolutionPanel";
