/**
 * @file packages/core/src/domain/site/validators/social.ts
 * @layer core/domain/site/validators
 * @description Blocking domain invariants for social settings.
 * @remarks
 * Shape and base item validation are handled upstream by schemas and adapters.
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

function assertSocialItem(it: SocialItem, index: number): void {
  const id = String(it.id ?? "").trim();
  const kind = it.kind;
  const href = String(it.href ?? "").trim();

  if (!id) {
    throw new DomainError({
      code: EC.SOCIAL_ID_REQUIRED,
      message: EC.SOCIAL_ID_REQUIRED,
      details: { path: ["social", "items", index, "id"] },
    });
  }

  const pathBase = ["social", "items", index, "href"] as const;

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

  if (isMailtoHref(href)) {
    throw new DomainError({
      code: EC.SOCIAL_INVALID_FOR_PLATFORM,
      message: EC.SOCIAL_INVALID_FOR_PLATFORM,
      details: { path: pathBase, value: href, kind, rule: "disallows_mailto" },
    });
  }

  if (!isAbsoluteHttpUrlStrict(href)) {
    throw new DomainError({
      code: EC.SOCIAL_ABSOLUTE_REQUIRED,
      message: EC.SOCIAL_ABSOLUTE_REQUIRED,
      details: { path: pathBase, value: href, kind },
    });
  }
}

export function assertSocialSettings(s: SocialSettings): void {
  const seenIds = new Set<SocialItem["id"]>();
  const seenKinds = new Set<SocialItem["kind"]>();

  s.items.forEach((it, i) => {
    const id = String(it.id ?? "").trim();

    if (seenIds.has(id)) {
      throw new DomainError({
        code: EC.SOCIAL_DUPLICATE_ID,
        message: EC.SOCIAL_DUPLICATE_ID,
        details: { path: ["social", "items", i, "id"], id },
      });
    }
    seenIds.add(id);

    if (seenKinds.has(it.kind)) {
      throw new DomainError({
        code: EC.SOCIAL_DUPLICATE_KIND,
        message: EC.SOCIAL_DUPLICATE_KIND,
        details: { path: ["social", "items", i, "kind"], kind: it.kind },
      });
    }
    seenKinds.add(it.kind);

    assertSocialItem(it, i);
  });
}
