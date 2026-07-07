/**
 * @file packages/core/src/domain/demo/entities/demo-sandbox.ts
 * @layer core/domain/demo
 * @description Domain entity representing a temporary demo sandbox.
 * @remarks
 * A demo sandbox is a temporary clone of a seed website, linked to a temporary user and target website.
 */

export interface DemoSandbox {
  readonly demoInstanceId: string;
  readonly userId: string;
  readonly websiteId: string;
  readonly expiresAt: string;
  readonly createdAt: string;
}
