-- CreateEnum
CREATE TYPE "ContentState" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "WebsiteType" AS ENUM ('site', 'sandbox');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'editor');

-- CreateEnum
CREATE TYPE "WebsiteRole" AS ENUM ('owner', 'admin', 'editor');

-- CreateEnum
CREATE TYPE "MediaStorageProvider" AS ENUM ('vercel_blob', 'local');

-- CreateEnum
CREATE TYPE "MediaAssetKind" AS ENUM ('image', 'svg', 'favicon');

-- CreateTable
CREATE TABLE "Website" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WebsiteType" NOT NULL DEFAULT 'site',
    "sourceWebsiteId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Website_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteDomain" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "rawHost" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "role" "WebsiteRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "state" "ContentState" NOT NULL,
    "pageId" TEXT NOT NULL,
    "parentPageId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "blocks" JSONB NOT NULL,
    "sitemap" JSONB,
    "paginationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "state" "ContentState" NOT NULL,
    "header" JSONB NOT NULL,
    "footer" JSONB NOT NULL,
    "primaryMenu" JSONB NOT NULL,
    "legalMenu" JSONB NOT NULL,
    "social" JSONB NOT NULL,
    "identity" JSONB NOT NULL,
    "seo" JSONB NOT NULL,
    "theme" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL,
    "role" "UserRole" NOT NULL,
    "defaultWebsiteId" TEXT,
    "passwordHash" TEXT NOT NULL,
    "demo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoSandbox" (
    "demoInstanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoSandbox_pkey" PRIMARY KEY ("demoInstanceId")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "provider" "MediaStorageProvider" NOT NULL,
    "kind" "MediaAssetKind" NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "contentType" TEXT,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "originalSize" INTEGER,
    "optimizedSize" INTEGER,
    "wasResized" BOOLEAN,
    "wasCompressed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Website_slug_key" ON "Website"("slug");

-- CreateIndex
CREATE INDEX "Website_type_idx" ON "Website"("type");

-- CreateIndex
CREATE INDEX "Website_expiresAt_idx" ON "Website"("expiresAt");

-- CreateIndex
CREATE INDEX "Website_sourceWebsiteId_idx" ON "Website"("sourceWebsiteId");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteDomain_host_key" ON "WebsiteDomain"("host");

-- CreateIndex
CREATE INDEX "WebsiteDomain_websiteId_idx" ON "WebsiteDomain"("websiteId");

-- CreateIndex
CREATE INDEX "WebsiteAccess_websiteId_idx" ON "WebsiteAccess"("websiteId");

-- CreateIndex
CREATE INDEX "WebsiteAccess_userId_role_idx" ON "WebsiteAccess"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteAccess_userId_websiteId_key" ON "WebsiteAccess"("userId", "websiteId");

-- CreateIndex
CREATE INDEX "Page_websiteId_state_idx" ON "Page"("websiteId", "state");

-- CreateIndex
CREATE INDEX "Page_websiteId_state_parentPageId_idx" ON "Page"("websiteId", "state", "parentPageId");

-- CreateIndex
CREATE INDEX "Page_websiteId_state_position_idx" ON "Page"("websiteId", "state", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Page_websiteId_state_pageId_key" ON "Page"("websiteId", "state", "pageId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_websiteId_state_slug_key" ON "Page"("websiteId", "state", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_websiteId_state_key" ON "SiteSettings"("websiteId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_defaultWebsiteId_idx" ON "User"("defaultWebsiteId");

-- CreateIndex
CREATE UNIQUE INDEX "DemoSandbox_websiteId_key" ON "DemoSandbox"("websiteId");

-- CreateIndex
CREATE INDEX "DemoSandbox_expiresAt_idx" ON "DemoSandbox"("expiresAt");

-- CreateIndex
CREATE INDEX "DemoSandbox_userId_idx" ON "DemoSandbox"("userId");

-- CreateIndex
CREATE INDEX "MediaAsset_websiteId_createdAt_idx" ON "MediaAsset"("websiteId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_websiteId_kind_idx" ON "MediaAsset"("websiteId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_provider_key_key" ON "MediaAsset"("provider", "key");

-- AddForeignKey
ALTER TABLE "WebsiteDomain" ADD CONSTRAINT "WebsiteDomain_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteAccess" ADD CONSTRAINT "WebsiteAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteAccess" ADD CONSTRAINT "WebsiteAccess_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoSandbox" ADD CONSTRAINT "DemoSandbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoSandbox" ADD CONSTRAINT "DemoSandbox_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
