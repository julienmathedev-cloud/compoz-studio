/**
 * @file packages/infra/src/site/prisma-site-repository.ts
 * @layer infra/site
 * @description Prisma-backed SiteRepository implementation.
 * @remarks
 * Settings and the published index timestamp are persisted in PostgreSQL; index pages are projected by `Page.position`.
 */

import {
  CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type {
  DraftSiteIndexWithRevision,
  SiteIndex,
} from "@compoz/core/domain/site/entities/site-index";
import type {
  SiteSettings,
  SiteSettingsWithRevisions,
} from "@compoz/core/domain/site/entities/site-settings";
import type {
  CompareAndSetDraftHeaderInput,
  CompareAndSetDraftIdentityInput,
  CompareAndSetDraftLegalMenuInput,
  CompareAndSetDraftPrimaryMenuInput,
  CompareAndSetDraftSeoInput,
  CompareAndSetDraftSocialInput,
  CompareAndSetDraftThemeInput,
  DraftHeaderWithRevision,
  DraftIdentityWithRevision,
  DraftLegalMenuWithRevision,
  DraftPrimaryMenuWithRevision,
  DraftSeoWithRevision,
  DraftSocialWithRevision,
  DraftThemeWithRevision,
  CompareAndSetDraftFooterInput,
  DraftFooterWithRevision,
  SiteRepository,
} from "@compoz/core/domain/site/ports/site-repository";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { Prisma, type PrismaClient } from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { toDomainSiteIndex } from "@compoz/infra/site/mappers/site-index.mapper";
import {
  toDomainSiteSettings,
  toDomainSiteSettingsWithRevisions,
  toPrismaFooterSettings,
  toPrismaHeaderSettings,
  toPrismaIdentitySettings,
  toPrismaLegalMenuSettings,
  toPrismaPrimaryMenuSettings,
  toPrismaSeoSettings,
  toPrismaSiteSettingsCreateData,
  toPrismaSiteSettingsUpdateData,
  toPrismaSocialSettings,
  toPrismaThemeSettings,
  type PrismaContentState,
} from "@compoz/infra/site/mappers/site-settings.mapper";

type PrismaSiteRepositoryOptions = Readonly<{
  websiteId: string;
  client?: PrismaClient;
  transactionClient?: Prisma.TransactionClient;
}>;

type DraftSettingsSectionCasOptions<TSettings> = Readonly<{
  updateWhere: (expectedRevision: number) => Prisma.SiteSettingsWhereInput;
  updateData: (settings: Readonly<TSettings>) => Prisma.SiteSettingsUpdateManyMutationInput;
  createSettings: (
    defaults: SiteSettings,
    settings: Readonly<TSettings>,
  ) => SiteSettings;
  createRevision: Partial<
    Pick<
      Prisma.SiteSettingsCreateManyInput,
      | "headerRevision"
      | "footerRevision"
      | "identityRevision"
      | "primaryMenuRevision"
      | "legalMenuRevision"
      | "socialRevision"
      | "seoRevision"
      | "themeRevision"
    >
  >;
  result: (
    bundle: SiteSettingsWithRevisions,
  ) => Readonly<{ settings: TSettings; revision: number }>;
  operation: string;
}>;

function toPrismaContentState(state: ContentState): PrismaContentState {
  return state === CONTENT_STATE.PUBLISHED ? "published" : "draft";
}

export class PrismaSiteRepository implements SiteRepository {
  private readonly websiteId: string;
  private readonly client: PrismaClient | Prisma.TransactionClient;
  private readonly transactionScoped: boolean;

  constructor(opts: PrismaSiteRepositoryOptions) {
    this.websiteId = requireWebsiteId(
      opts.websiteId,
      "PrismaSiteRepository.constructor",
    );
    this.client = opts.transactionClient ?? opts.client ?? prisma;
    this.transactionScoped = opts.transactionClient !== undefined;
  }

  async ensureBase(): Promise<void> {
    await this.client.website.upsert({
      where: { id: this.websiteId },
      create: {
        id: this.websiteId,
        slug: this.websiteId,
        name: this.websiteId,
        type: "site",
      },
      update: {},
    });
  }

  async readIndex(state: ContentState): Promise<SiteIndex> {
    const prismaState = toPrismaContentState(state);

    const [pages, website] = await Promise.all([
      this.client.page.findMany({
        where: {
          websiteId: this.websiteId,
          state: prismaState,
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          pageId: true,
          slug: true,
          name: true,
          parentPageId: true,
          updatedAt: true,
        },
      }),
      state === CONTENT_STATE.PUBLISHED
        ? this.client.website.findUnique({
            where: { id: this.websiteId },
            select: { lastPublishedAt: true },
          })
        : Promise.resolve(null),
    ]);

    const index = toDomainSiteIndex(pages, state);

    if (state !== CONTENT_STATE.PUBLISHED) return index;

    return {
      ...index,
      updatedAt: website?.lastPublishedAt?.toISOString() ?? "",
    };
  }

  async readDraftIndexWithRevision(): Promise<DraftSiteIndexWithRevision> {
    const client = this.client;

    if (!this.transactionScoped) {
      const prismaClient = client as PrismaClient;

      return prismaClient.$transaction(
        async (tx) => {
          const repository = new PrismaSiteRepository({
            websiteId: this.websiteId,
            transactionClient: tx,
          });

          return repository.readDraftIndexWithRevision();
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        },
      );
    }

    const transactionClient = client as Prisma.TransactionClient;

    const [index, website] = await Promise.all([
      this.readIndex(CONTENT_STATE.DRAFT),
      transactionClient.website.findUnique({
        where: { id: this.websiteId },
        select: { draftStructureRevision: true },
      }),
    ]);

    if (!website) {
      throw new Error(
        "PrismaSiteRepository.readDraftIndexWithRevision: website not found.",
      );
    }

    return {
      index,
      draftStructureRevision: website.draftStructureRevision,
    };
  }

  async readSettings(state: ContentState): Promise<SiteSettings> {
    const prismaState = toPrismaContentState(state);

    const row = await this.client.siteSettings.findUnique({
      where: {
        websiteId_state: {
          websiteId: this.websiteId,
          state: prismaState,
        },
      },
    });

    return toDomainSiteSettings(row);
  }

  async readSettingsWithRevisions(
    state: ContentState,
  ): Promise<SiteSettingsWithRevisions> {
    const prismaState = toPrismaContentState(state);

    const row = await this.client.siteSettings.findUnique({
      where: {
        websiteId_state: {
          websiteId: this.websiteId,
          state: prismaState,
        },
      },
    });

    return toDomainSiteSettingsWithRevisions(row);
  }

  async compareAndSetDraftFooter(
    input: CompareAndSetDraftFooterInput,
  ): Promise<DraftFooterWithRevision | null> {
    return this.compareAndSetDraftSettingsSection(
      {
        expectedRevision: input.expectedRevision,
        settings: input.footer,
      },
      {
        operation: "PrismaSiteRepository.compareAndSetDraftFooter",
        updateWhere: (footerRevision) => ({
          websiteId: this.websiteId,
          state: "draft",
          footerRevision,
        }),
        updateData: (footer) => ({
          footer: toPrismaFooterSettings(footer),
          footerRevision: { increment: 1 },
        }),
        createSettings: (defaults, footer) => ({ ...defaults, footer }),
        createRevision: { footerRevision: 1 },
        result: (bundle) => ({
          settings: bundle.settings.footer,
          revision: bundle.revisions.footerRevision,
        }),
      },
    );
  }

  private async compareAndSetDraftSettingsSection<TSettings>(
    input: Readonly<{ expectedRevision: number; settings: Readonly<TSettings> }>,
    options: DraftSettingsSectionCasOptions<TSettings>,
  ): Promise<Readonly<{ settings: TSettings; revision: number }> | null> {
    const client = this.client;

    if (!this.transactionScoped) {
      return (client as PrismaClient).$transaction(async (tx) => {
        const repository = new PrismaSiteRepository({
          websiteId: this.websiteId,
          transactionClient: tx,
        });

        return repository.compareAndSetDraftSettingsSection(input, options);
      });
    }

    const transactionClient = client as Prisma.TransactionClient;
    // Keep the lock order identical to publication and draft structure writes:
    // Website first, then the revisioned settings row.
    await transactionClient.$queryRaw(
      Prisma.sql`SELECT "id" FROM "Website" WHERE "id" = ${this.websiteId} FOR UPDATE`,
    );
    const update = await transactionClient.siteSettings.updateMany({
      where: options.updateWhere(input.expectedRevision),
      data: options.updateData(input.settings),
    });

    if (update.count === 1) {
      const row = await transactionClient.siteSettings.findUnique({
        where: {
          websiteId_state: {
            websiteId: this.websiteId,
            state: "draft",
          },
        },
      });
      if (!row) {
        throw new Error(
          `${options.operation}: updated draft settings row not found.`,
        );
      }
      return options.result(toDomainSiteSettingsWithRevisions(row));
    }

    if (input.expectedRevision !== 0) return null;

    const creation = await transactionClient.siteSettings.createMany({
      data: {
        ...toPrismaSiteSettingsCreateData(
          this.websiteId,
          "draft",
          options.createSettings(toDomainSiteSettings(null), input.settings),
        ),
        ...options.createRevision,
      },
      skipDuplicates: true,
    });

    if (creation.count === 0) return null;

    const row = await transactionClient.siteSettings.findUnique({
      where: {
        websiteId_state: {
          websiteId: this.websiteId,
          state: "draft",
        },
      },
    });
    if (!row) {
      throw new Error(
        `${options.operation}: created draft settings row not found.`,
      );
    }
    return options.result(toDomainSiteSettingsWithRevisions(row));
  }

  async compareAndSetDraftHeader(
    input: CompareAndSetDraftHeaderInput,
  ): Promise<DraftHeaderWithRevision | null> {
    return this.compareAndSetDraftSettingsSection(
      {
        expectedRevision: input.expectedRevision,
        settings: input.header,
      },
      {
        operation: "PrismaSiteRepository.compareAndSetDraftHeader",
        updateWhere: (headerRevision) => ({
          websiteId: this.websiteId,
          state: "draft",
          headerRevision,
        }),
        updateData: (header) => ({
          header: toPrismaHeaderSettings(header),
          headerRevision: { increment: 1 },
        }),
        createSettings: (defaults, header) => ({ ...defaults, header }),
        createRevision: { headerRevision: 1 },
        result: (bundle) => ({
          settings: bundle.settings.header,
          revision: bundle.revisions.headerRevision,
        }),
      },
    );
  }

  async compareAndSetDraftIdentity(
    input: CompareAndSetDraftIdentityInput,
  ): Promise<DraftIdentityWithRevision | null> {
    return this.compareAndSetDraftSettingsSection(
      {
        expectedRevision: input.expectedRevision,
        settings: input.identity,
      },
      {
        operation: "PrismaSiteRepository.compareAndSetDraftIdentity",
        updateWhere: (identityRevision) => ({
          websiteId: this.websiteId,
          state: "draft",
          identityRevision,
        }),
        updateData: (identity) => ({
          identity: toPrismaIdentitySettings(identity),
          identityRevision: { increment: 1 },
        }),
        createSettings: (defaults, identity) => ({ ...defaults, identity }),
        createRevision: { identityRevision: 1 },
        result: (bundle) => ({
          settings: bundle.settings.identity,
          revision: bundle.revisions.identityRevision,
        }),
      },
    );
  }

  async compareAndSetDraftPrimaryMenu(
    input: CompareAndSetDraftPrimaryMenuInput,
  ): Promise<DraftPrimaryMenuWithRevision | null> {
    return this.compareAndSetDraftSettingsSection(
      {
        expectedRevision: input.expectedRevision,
        settings: input.primaryMenu,
      },
      {
        operation: "PrismaSiteRepository.compareAndSetDraftPrimaryMenu",
        updateWhere: (primaryMenuRevision) => ({
          websiteId: this.websiteId,
          state: "draft",
          primaryMenuRevision,
        }),
        updateData: (primaryMenu) => ({
          primaryMenu: toPrismaPrimaryMenuSettings(primaryMenu),
          primaryMenuRevision: { increment: 1 },
        }),
        createSettings: (defaults, primaryMenu) => ({ ...defaults, primaryMenu }),
        createRevision: { primaryMenuRevision: 1 },
        result: (bundle) => ({
          settings: bundle.settings.primaryMenu,
          revision: bundle.revisions.primaryMenuRevision,
        }),
      },
    );
  }

  async compareAndSetDraftLegalMenu(
    input: CompareAndSetDraftLegalMenuInput,
  ): Promise<DraftLegalMenuWithRevision | null> {
    return this.compareAndSetDraftSettingsSection(
      {
        expectedRevision: input.expectedRevision,
        settings: input.legalMenu,
      },
      {
        operation: "PrismaSiteRepository.compareAndSetDraftLegalMenu",
        updateWhere: (legalMenuRevision) => ({
          websiteId: this.websiteId,
          state: "draft",
          legalMenuRevision,
        }),
        updateData: (legalMenu) => ({
          legalMenu: toPrismaLegalMenuSettings(legalMenu),
          legalMenuRevision: { increment: 1 },
        }),
        createSettings: (defaults, legalMenu) => ({ ...defaults, legalMenu }),
        createRevision: { legalMenuRevision: 1 },
        result: (bundle) => ({
          settings: bundle.settings.legalMenu,
          revision: bundle.revisions.legalMenuRevision,
        }),
      },
    );
  }

  async compareAndSetDraftSocial(
    input: CompareAndSetDraftSocialInput,
  ): Promise<DraftSocialWithRevision | null> {
    return this.compareAndSetDraftSettingsSection(
      {
        expectedRevision: input.expectedRevision,
        settings: input.social,
      },
      {
        operation: "PrismaSiteRepository.compareAndSetDraftSocial",
        updateWhere: (socialRevision) => ({
          websiteId: this.websiteId,
          state: "draft",
          socialRevision,
        }),
        updateData: (social) => ({
          social: toPrismaSocialSettings(social),
          socialRevision: { increment: 1 },
        }),
        createSettings: (defaults, social) => ({ ...defaults, social }),
        createRevision: { socialRevision: 1 },
        result: (bundle) => ({
          settings: bundle.settings.social,
          revision: bundle.revisions.socialRevision,
        }),
      },
    );
  }

  async compareAndSetDraftSeo(
    input: CompareAndSetDraftSeoInput,
  ): Promise<DraftSeoWithRevision | null> {
    return this.compareAndSetDraftSettingsSection(
      {
        expectedRevision: input.expectedRevision,
        settings: input.seo,
      },
      {
        operation: "PrismaSiteRepository.compareAndSetDraftSeo",
        updateWhere: (seoRevision) => ({
          websiteId: this.websiteId,
          state: "draft",
          seoRevision,
        }),
        updateData: (seo) => ({
          seo: toPrismaSeoSettings(seo),
          seoRevision: { increment: 1 },
        }),
        createSettings: (defaults, seo) => ({ ...defaults, seo }),
        createRevision: { seoRevision: 1 },
        result: (bundle) => ({
          settings: bundle.settings.seo,
          revision: bundle.revisions.seoRevision,
        }),
      },
    );
  }

  async compareAndSetDraftTheme(
    input: CompareAndSetDraftThemeInput,
  ): Promise<DraftThemeWithRevision | null> {
    return this.compareAndSetDraftSettingsSection(
      {
        expectedRevision: input.expectedRevision,
        settings: input.theme,
      },
      {
        operation: "PrismaSiteRepository.compareAndSetDraftTheme",
        updateWhere: (themeRevision) => ({
          websiteId: this.websiteId,
          state: "draft",
          themeRevision,
        }),
        updateData: (theme) => ({
          theme: toPrismaThemeSettings(theme),
          themeRevision: { increment: 1 },
        }),
        createSettings: (defaults, theme) => ({ ...defaults, theme }),
        createRevision: { themeRevision: 1 },
        result: (bundle) => ({
          settings: bundle.settings.theme,
          revision: bundle.revisions.themeRevision,
        }),
      },
    );
  }

  async putSettings(
    state: ContentState,
    settings: Readonly<SiteSettings>,
  ): Promise<void> {
    await this.ensureBase();

    const prismaState = toPrismaContentState(state);

    await this.client.siteSettings.upsert({
      where: {
        websiteId_state: {
          websiteId: this.websiteId,
          state: prismaState,
        },
      },
      create: toPrismaSiteSettingsCreateData(
        this.websiteId,
        prismaState,
        settings,
      ),
      update: toPrismaSiteSettingsUpdateData(settings),
    });
  }
}
