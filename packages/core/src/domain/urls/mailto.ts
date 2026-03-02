/**
 * @file packages/core/src/domain/urls/mailto.ts
 * @layer core/domain/urls
 * @description
 * Helpers pour analyser et valider des liens `mailto:` : parsing des destinataires,
 * accès aux query params (subject/body/cc/bcc…) et détection simple via `isMailtoHref`.
 *
 * La politique produit (destinataire obligatoire ou non) est centralisée ici.
 */

import { isSimpleEmail } from "@compoz/core/domain/urls/guards";

/**
 * Politique produit :
 * - RFC 6068 → un lien `mailto:` peut exister sans destinataire (ex : pour préremplir subject/body).
 * - Ton produit autorise donc ce format par défaut.
 * - Si un jour tu veux rendre les destinataires obligatoires → mettre `true`.
 */
const REQUIRE_MAILTO_RECIPIENT = false as const;

/**
 * Structure retournée par `parseMailto`.
 *
 * @property recipients  Liste des destinataires extraits et validés (peut être vide).
 *                       Normalisés en lower-case.
 * @property params      Paramètres de type query : subject, body, cc, bcc, etc.
 */
export type ParsedMailto = {
  recipients: string[];
  params: URLSearchParams;
};

/**
 * DecodeURIComponent "safe".
 * @remarks
 * - On ne tente de décoder que si ça ressemble à une séquence encodée (`%..`).
 * - En cas d'encodage invalide → on renvoie la valeur brute.
 */
function tryDecode(value: string): string {
  if (!value || !value.includes("%")) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Analyse une URL `mailto:` et en extrait :
 * - La liste des destinataires (séparés par virgule/point-virgule)
 * - Les paramètres de query (subject, body, cc, bcc...)
 *
 * Conditions :
 * - Retourne `null` si le protocole n'est pas `mailto:` ou si un email est invalide.
 * - La politique `REQUIRE_MAILTO_RECIPIENT` peut exiger au moins un destinataire.
 *
 * @param href URL potentiellement de type mailto:
 * @returns `ParsedMailto` si valide, sinon `null`
 */
export function parseMailto(href: string): ParsedMailto | null {
  const input = (href ?? "").trim();
  if (!input) return null;

  try {
    const url = new URL(input);
    if (url.protocol.toLowerCase() !== "mailto:") return null;

    // Le pathname d’un mailto: contient la liste brute des destinataires.
    // Selon les environnements, il peut déjà être partiellement décodé :
    // on applique un decode "safe" uniquement si nécessaire.
    const raw = url.pathname ? tryDecode(url.pathname) : "";

    // Split par virgule ou ";" (cas fréquent), trim, suppression des éléments vides.
    const recipients = raw
      ? raw
          .split(/[;,]/g)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s.toLowerCase())
      : [];

    // Validation de chaque email via la règle simple définie dans /constants/shared/web.
    for (const r of recipients) {
      if (!isSimpleEmail(r)) return null;
    }

    // Si la politique impose un destinataire obligatoire → vérification.
    if (REQUIRE_MAILTO_RECIPIENT && recipients.length === 0) return null;

    return {
      recipients,
      params: url.searchParams,
    };
  } catch {
    // URL invalide → plusieurs cas possibles (ex: caractère interdit)
    return null;
  }
}

/**
 * Vérifie rapidement si un `href` est un mailto: valide.
 *
 * Implémentation simple : utilise `parseMailto` pour la validation réelle.
 */
export function isMailtoHref(href?: string | null): boolean {
  return typeof href === "string" && parseMailto(href) !== null;
}
