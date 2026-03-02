/**
 * @file packages/core/src/domain/site/entities/footer.ts
 * @layer core/domain
 * @description
 * Entité métier représentant la configuration du footer du site.
 * Définit la forme canonique des données côté domaine, sans logique
 * ni valeurs par défaut (voir `defaults/footer.ts`).
 */

export interface FooterSettings {
  /** Texte de copyright affiché dans le footer. Peut être vide. */
  copyright: string;

  /** Affiche automatiquement l’année courante lors du rendu. */
  showYear: boolean;
}
