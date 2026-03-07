/**
 * @file packages/core/src/domain/site/validators/social.ts
 * @layer core/domain
 * @description
 * Validateur métier — invariants Social bloquants :
 * - email ⇒ `mailto:` obligatoire
 * - autres ⇒ URL http(s) absolue (non mailto)
 * - unicité des plateformes (`kind`) dans la liste
 *
 * @remarks
 * Suppose que la shape de base (items, types) est validée en amont (schemas/adapters).
 * Ce module se concentre uniquement sur les invariants stricts du domaine.
 */

import { SOCIAL_KIND_EMAIL } from "@compoz/core/constants/social/social-kinds";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  SocialItem,
  SocialSettings,
} from "@compoz/core/domain/site/entities/social";
import { isAbsoluteHttpUrlStrict } from "@compoz/core/domain/urls/guards";
import { isMailtoHref } from "@compoz/core/domain/urls/mailto";

/**
 * Vérifie les invariants d’un item social isolé.
 *
 * @param it    Élément social à valider.
 * @param index Index de l’élément dans le tableau `items`.
 *
 * @throws DomainError
 * - `EC.SOCIAL_INVALID_FOR_PLATFORM`
 * - `EC.SOCIAL_ABSOLUTE_REQUIRED`
 */
function assertSocialItem(it: SocialItem, index: number): void {
  const kind = it.kind;
  const href = String(it.href ?? "").trim();

  const pathBase = ["social", "items", index, "href"] as const;

  // Invariant : plateforme "email" ⇒ mailto: obligatoire
  if (kind === SOCIAL_KIND_EMAIL) {
    if (!isMailtoHref(href)) {
      throw new DomainError({
        code: EC.SOCIAL_INVALID_FOR_PLATFORM,
        message: EC.SOCIAL_INVALID_FOR_PLATFORM,
        details: { path: pathBase, value: href, kind, rule: "expects_mailto" },
      });
    }
    return;
  }

  // Invariant : hors email ⇒ mailto: interdit
  if (isMailtoHref(href)) {
    throw new DomainError({
      code: EC.SOCIAL_INVALID_FOR_PLATFORM,
      message: EC.SOCIAL_INVALID_FOR_PLATFORM,
      details: { path: pathBase, value: href, kind, rule: "disallows_mailto" },
    });
  }

  // Invariant : hors email ⇒ http(s) absolu requis
  if (!isAbsoluteHttpUrlStrict(href)) {
    throw new DomainError({
      code: EC.SOCIAL_ABSOLUTE_REQUIRED,
      message: EC.SOCIAL_ABSOLUTE_REQUIRED,
      details: { path: pathBase, value: href, kind },
    });
  }
}

/**
 * Invariants globaux : unicité des plateformes + items valides.
 *
 * @throws DomainError
 * - `EC.SOCIAL_DUPLICATE_KIND`
 * - (peut lever les erreurs de `assertSocialItem`)
 */
export function assertSocialSettings(s: SocialSettings): void {
  const seen = new Set<SocialItem["kind"]>();

  s.items.forEach((it, i) => {
    if (seen.has(it.kind)) {
      throw new DomainError({
        code: EC.SOCIAL_DUPLICATE_KIND,
        message: EC.SOCIAL_DUPLICATE_KIND,
        details: { path: ["social", "items", i, "kind"], kind: it.kind },
      });
    }
    seen.add(it.kind);

    assertSocialItem(it, i);
  });
}
