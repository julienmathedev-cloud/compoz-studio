/**
 * @file packages/core/src/domain/users/use-cases/delete-user.types.ts
 * @layer core/domain
 * @description
 * Types du use-case de suppression d’utilisateur : entrées, sorties et dépendances.
 * Définit le contrat **sans logique** (implémentation dans `delete-user.ts`).
 */

import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

/** Entrée : id obligatoire. */
export interface DeleteUserInput {
  userId: string;
}

/** Sortie minimale : suppression effectuée (ou déjà effectuée). */
export interface DeleteUserResult {
  ok: true;
}

/** Dépendances nécessaires au use-case. */
export interface DeleteUserDeps {
  users: UsersRepository;
}
