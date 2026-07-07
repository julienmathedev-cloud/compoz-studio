/**
 * @file packages/core/src/domain/pages/entities/cells/steps.ts
 * @layer core/domain/pages
 * @description Steps cell domain entity.
 */

export type StepsVariant = "vertical" | "horizontal";

export type StepItem = {
  id: string;
  title: string;
  description: string;
};

export type StepsCell = {
  id: string;
  kind: "steps";
  cssClassName?: string;
  variant: StepsVariant;
  items: ReadonlyArray<StepItem>;
};
