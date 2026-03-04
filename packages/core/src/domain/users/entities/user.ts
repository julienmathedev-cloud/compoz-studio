/**
 * @file src/core/domain/users/entities/user.ts
 * @layer core/domain
 * @description
 * Entité métier représentant un utilisateur Studio : identité, statut, RBAC,
 * et rattachement multi-tenant.
 *
 * Invariant : ce fichier définit uniquement la forme canonique (types).
 */

/**
 * Rôles possibles dans le Studio (RBAC minimal V0.5).
 *
 * Remarques :
 * - "admin" : accès aux fonctionnalités d'administration (ex: gestion users/tenants).
 * - "editor" : accès aux fonctionnalités d'édition du site (contenu/settings selon règles).
 */
export type UserRole = "admin" | "editor";

/**
 * Statut d'un utilisateur (utile pour désactiver un compte sans le supprimer).
 */
export type UserStatus = "active" | "disabled";

/** Métadonnées de l'utilisateur (timestamps ISO 8601). */
export interface UserMeta {
  /** Date de création. */
  createdAt: string;
  /** Date de dernière mise à jour. */
  updatedAt: string;
  /** Date de dernière connexion (optionnel). */
  lastLoginAt?: string;
}

/**
 * RBAC + multi-tenant associé à un utilisateur.
 *
 * Remarques :
 * - tenantIds peut contenir "*" pour signifier accès global (super-admin).
 * - defaultTenantId : tenant "principal" utilisé par défaut (login + fallback).
 */
export interface UserRbac {
  /** Rôle de l'utilisateur. */
  role: UserRole;

  /** Liste des tenants autorisés SOT. */
  tenantIds: ReadonlyArray<string>;

  /** Tenant par défaut (doit être inclus dans tenantIds sauf wildcard). */
  defaultTenantId: string;
}

/**
 * Entité principale représentant un utilisateur du Studio.
 *
 * Notes :
 * - Le mot de passe n'appartient pas au domaine (stockage/crypto = infra).
 * - L'email est canonisé en lower-case côté infra/validation.
 */
export interface User {
  /** Identifiant unique de l'utilisateur (clé métier). */
  id: string;

  /** Email de login (clé métier). */
  email: string;

  /** Nom affiché (admin). */
  name?: string;

  /** Statut du compte. */
  status: UserStatus;

  /** RBAC + multi-tenant. */
  rbac: UserRbac;

  /** Métadonnées. */
  meta: UserMeta;
}

/**
 * Résumé minimal utilisé dans les listes/admin.
 */
export type UserSummary = Pick<User, "id" | "email" | "name" | "status">;

/**
 * Option d'utilisateur sélectionnable (picker/autocomplete).
 */
export type UserOption = Readonly<{
  label: string;
  value: string; // userId
  email: string;
}>;
