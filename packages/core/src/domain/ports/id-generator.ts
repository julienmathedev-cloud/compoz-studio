/**
 * @file packages/core/src/domain/ports/id-generator.ts
 * @layer core/domain
 *
 * @description
 * Port domaine pour générer des IDs stables (persistés).
 *
 * @remarks
 * - Les IDs sont opaques et immuables (créés une seule fois).
 * - Implémentation fournie par l’infrastructure (uuidv7 aujourd’hui, DB demain).
 */
export interface IdGenerator {
  /** Génère un identifiant unique (string). */
  nextId(): string;
}
