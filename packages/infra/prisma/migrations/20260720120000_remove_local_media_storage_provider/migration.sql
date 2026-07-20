BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "MediaAsset"
    WHERE "provider" = 'local'::"MediaStorageProvider"
  ) THEN
    RAISE EXCEPTION
      'Cannot remove MediaStorageProvider.local: MediaAsset rows still use it.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "MediaAsset"
    WHERE "url" LIKE '%/uploads/%'
       OR "key" LIKE '%/uploads/%'
       OR "key" LIKE 'uploads/%'
  ) THEN
    RAISE EXCEPTION
      'Cannot remove local media compatibility: MediaAsset rows still reference local upload paths.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "SiteSettings"
    WHERE "header"::text LIKE '%/uploads/%'
       OR "footer"::text LIKE '%/uploads/%'
       OR "primaryMenu"::text LIKE '%/uploads/%'
       OR "legalMenu"::text LIKE '%/uploads/%'
       OR "social"::text LIKE '%/uploads/%'
       OR "identity"::text LIKE '%/uploads/%'
       OR "seo"::text LIKE '%/uploads/%'
       OR "theme"::text LIKE '%/uploads/%'
  ) THEN
    RAISE EXCEPTION
      'Cannot remove local media compatibility: SiteSettings rows still reference /uploads/ URLs.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Page"
    WHERE "seoTitle" LIKE '%/uploads/%'
       OR "seoDescription" LIKE '%/uploads/%'
       OR "blocks"::text LIKE '%/uploads/%'
       OR "sitemap"::text LIKE '%/uploads/%'
  ) THEN
    RAISE EXCEPTION
      'Cannot remove local media compatibility: Page rows still reference /uploads/ URLs.';
  END IF;
END $$;

CREATE TYPE "MediaStorageProvider_new" AS ENUM ('vercel_blob');

ALTER TABLE "MediaAsset"
  ALTER COLUMN "provider" TYPE "MediaStorageProvider_new"
  USING ("provider"::text::"MediaStorageProvider_new");

DROP TYPE "MediaStorageProvider";

ALTER TYPE "MediaStorageProvider_new" RENAME TO "MediaStorageProvider";

COMMIT;
