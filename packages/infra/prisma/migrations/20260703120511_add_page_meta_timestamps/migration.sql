-- Add Page business timestamps separately from technical DB timestamps.
ALTER TABLE "Page" ADD COLUMN "metaCreatedAt" TIMESTAMP(3);
ALTER TABLE "Page" ADD COLUMN "metaUpdatedAt" TIMESTAMP(3);

-- Backfill existing rows from the previous technical timestamp source.
UPDATE "Page"
SET
    "metaCreatedAt" = "createdAt",
    "metaUpdatedAt" = "updatedAt";

ALTER TABLE "Page" ALTER COLUMN "metaCreatedAt" SET NOT NULL;
ALTER TABLE "Page" ALTER COLUMN "metaCreatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Page" ALTER COLUMN "metaUpdatedAt" SET NOT NULL;
ALTER TABLE "Page" ALTER COLUMN "metaUpdatedAt" SET DEFAULT CURRENT_TIMESTAMP;
