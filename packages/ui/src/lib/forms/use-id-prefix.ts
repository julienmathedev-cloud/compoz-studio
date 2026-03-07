/**
 * @file packages/ui/src/lib/forms/use-id-prefix.ts
 * @layer ui/lib/forms
 * @description
 * Helpers pour générer des identifiants stables (SSR-safe) destinés à l’a11y des formulaires
 * (association label/input, messages d’erreur, textes d’aide).
 */

import { useId, useMemo } from "react";

/* -------------------------------------------------------------------------- */
/*                            Internal helpers                                 */
/* -------------------------------------------------------------------------- */

/**
 * Normalise un segment d'ID pour garantir un format sûr :
 * - trim
 * - kebab-case
 * - uniquement [a-z0-9-]
 */
function normalizeIdSegment(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* -------------------------------------------------------------------------- */
/*                               useIdPrefix                                   */
/* -------------------------------------------------------------------------- */

/**
 * Génère un préfixe d'ID stable basé sur un `seed` + `useId()`.
 *
 * @remarks
 * - `seed` est normalisé en kebab-case.
 * - La partie `useId()` est "nettoyée" pour ne contenir que [a-z0-9]
 *   (React peut inclure ":" selon l'environnement).
 */
export function useIdPrefix(seed: string): string {
  const reactId = useId();

  return useMemo(() => {
    const normalizedSeed = normalizeIdSegment(seed);

    // Nettoyage de l'id React : on garde uniquement [a-z0-9]
    const normalizedReactId = reactId.toLowerCase().replace(/[^a-z0-9]+/g, "");

    return normalizedSeed
      ? `${normalizedSeed}-${normalizedReactId}`
      : normalizedReactId;
  }, [seed, reactId]);
}

/* -------------------------------------------------------------------------- */
/*                               FieldIds type                                 */
/* -------------------------------------------------------------------------- */

export type FieldIds = {
  /** Identifiant du champ (input, textarea, select, etc.) */
  fieldId: string;

  /** Identifiant du label relié au champ */
  labelId: string;

  /** Identifiant pour un message d’erreur (a11y) */
  errorId: string;

  /** Identifiant pour un texte d’aide (a11y) */
  helpId: string;

  /** Identifiant pour un hint technique (optionnel) */
  hintId?: string;
};

/* -------------------------------------------------------------------------- */
/*                              createFieldIds                                 */
/* -------------------------------------------------------------------------- */

/**
 * Génère les IDs standard pour un champ à partir d'un préfixe et d'un nom de champ.
 *
 * @param idPrefix Préfixe généré par `useIdPrefix`, ex: "identity-r0f1a2"
 * @param name Nom du champ RHF, ex: "title" ou "seo.title"
 * @param opts Options de génération (ex: activer `hintId`)
 */
export function createFieldIds(
  idPrefix: string,
  name: string,
  opts?: {
    hint?: boolean;
  },
): FieldIds {
  // Normalisation du nom : éviter "." et caractères spéciaux dans les IDs
  const normalizedName = normalizeIdSegment(name) || "field";

  const base = `${idPrefix}-${normalizedName}`;

  return {
    fieldId: base,
    labelId: `${base}-label`,
    errorId: `${base}-error`,
    helpId: `${base}-help`,
    hintId: opts?.hint ? `${base}-hint` : undefined,
  };
}
