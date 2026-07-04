/**
 * @file src/core/domain/users/entities/user.ts
 * @layer core/domain
 *
 * @description
 * Entité métier représentant un utilisateur Studio : identité, statut, RBAC
 * et rattachement multi-website.
 *
 * @remarks
 * Invariant : ce fichier définit uniquement la forme canonique des types.
 */

export type UserRole = "admin" | "editor";
export type UserStatus = "active" | "disabled";

/** Métadonnées de l’utilisateur, timestamps ISO 8601. */
export interface UserMeta {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLoginAt?: string;
}

/**
 * Métadonnées de sandbox démo associées à un utilisateur temporaire.
 *
 * @remarks
 * - Présent uniquement pour les utilisateurs de démo.
 * - `demoInstanceId` permet de rattacher le user à une sandbox isolée.
 * - `expiresAt` permet de déterminer si la sandbox est encore valide.
 */
export interface UserDemoMeta {
  readonly isDemo: boolean;
  readonly demoInstanceId: string;
  readonly expiresAt: string;
}

/**
 * RBAC + accès Websites associé à un utilisateur.
 *
 * @remarks
 * - `websiteIds` contient les Prisma Website.id autorisés pour l’utilisateur.
 * - `websiteIds` peut contenir "*" pour signifier un accès global admin.
 * - `defaultWebsiteId` est le Prisma Website.id utilisé par défaut
 *   au login et en fallback de session.
 */
export interface UserRbac {
  readonly role: UserRole;
  readonly websiteIds: ReadonlyArray<string>;
  readonly defaultWebsiteId: string;
}

/**
 * Entité principale représentant un utilisateur du Studio.
 *
 * @remarks
 * - Le mot de passe n’appartient pas au domaine : stockage / crypto = infra.
 * - L’email est canonisé en lower-case côté infra / validation.
 * - `demo` est présent uniquement pour les utilisateurs créés pour une sandbox démo.
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly status: UserStatus;
  readonly rbac: UserRbac;
  readonly meta: UserMeta;
  readonly demo?: UserDemoMeta;
}

export type UserSummary = Pick<User, "id" | "email" | "name" | "status">;

export type UserOption = Readonly<{
  label: string;
  value: string; // userId
  email: string;
}>;
