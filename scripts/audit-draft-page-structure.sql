-- Read-only audit for draft page structure invariants.
-- Execute only against an explicitly identified database.
BEGIN TRANSACTION READ ONLY;

-- 1. Duplicate positions per Website and content state.
SELECT "websiteId", "state", "position", COUNT(*) AS "pageCount"
FROM "Page"
GROUP BY "websiteId", "state", "position"
HAVING COUNT(*) > 1;

-- 2. Non-sequential positions (expected zero-based sequence).
WITH ranked AS (
  SELECT
    "id",
    "websiteId",
    "state",
    "pageId",
    "position",
    ROW_NUMBER() OVER (
      PARTITION BY "websiteId", "state"
      ORDER BY "position", "createdAt", "id"
    ) - 1 AS "expectedPosition"
  FROM "Page"
)
SELECT "id", "websiteId", "state", "pageId", "position", "expectedPosition"
FROM ranked
WHERE "position" <> "expectedPosition";

-- 3. Draft root pages with pagination enabled.
SELECT "id", "websiteId", "pageId"
FROM "Page"
WHERE "state" = 'draft'
  AND "parentPageId" IS NULL
  AND "paginationEnabled" = TRUE;

-- 4. Parent identifiers that do not resolve in the same Website and state.
SELECT child."id", child."websiteId", child."state", child."pageId", child."parentPageId"
FROM "Page" child
WHERE child."parentPageId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "Page" parent
    WHERE parent."websiteId" = child."websiteId"
      AND parent."state" = child."state"
      AND parent."pageId" = child."parentPageId"
  );

-- 5. Classification: unresolved parents found only in another Website.
SELECT child."id", child."websiteId", child."state", child."pageId", child."parentPageId"
FROM "Page" child
WHERE child."parentPageId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "Page" parent
    WHERE parent."websiteId" = child."websiteId"
      AND parent."state" = child."state"
      AND parent."pageId" = child."parentPageId"
  )
  AND EXISTS (
    SELECT 1
    FROM "Page" parent
    WHERE parent."websiteId" <> child."websiteId"
      AND parent."pageId" = child."parentPageId"
  );

-- 6. Draft pages whose parent exists only in published state.
SELECT child."id", child."websiteId", child."pageId", child."parentPageId"
FROM "Page" child
WHERE child."state" = 'draft'
  AND child."parentPageId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "Page" draft_parent
    WHERE draft_parent."websiteId" = child."websiteId"
      AND draft_parent."state" = 'draft'
      AND draft_parent."pageId" = child."parentPageId"
  )
  AND EXISTS (
    SELECT 1
    FROM "Page" published_parent
    WHERE published_parent."websiteId" = child."websiteId"
      AND published_parent."state" = 'published'
      AND published_parent."pageId" = child."parentPageId"
  );

-- 7. Children that themselves have children.
SELECT parent."id", parent."websiteId", parent."state", parent."pageId"
FROM "Page" parent
WHERE parent."parentPageId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "Page" child
    WHERE child."websiteId" = parent."websiteId"
      AND child."state" = parent."state"
      AND child."parentPageId" = parent."pageId"
  );

-- 8. Direct or transitive cycles.
WITH RECURSIVE ancestry AS (
  SELECT
    page."websiteId",
    page."state",
    page."pageId" AS "originPageId",
    page."parentPageId" AS "ancestorPageId",
    ARRAY[page."pageId"]::TEXT[] AS path,
    FALSE AS cycle
  FROM "Page" page
  WHERE page."parentPageId" IS NOT NULL

  UNION ALL

  SELECT
    ancestry."websiteId",
    ancestry."state",
    ancestry."originPageId",
    parent."parentPageId",
    ancestry.path || parent."pageId",
    parent."pageId" = ANY(ancestry.path)
  FROM ancestry
  JOIN "Page" parent
    ON parent."websiteId" = ancestry."websiteId"
   AND parent."state" = ancestry."state"
   AND parent."pageId" = ancestry."ancestorPageId"
  WHERE ancestry.cycle = FALSE
)
SELECT DISTINCT "websiteId", "state", "originPageId", path
FROM ancestry
WHERE cycle = TRUE;

-- 9. Home pages having a parent.
SELECT "id", "websiteId", "state", "pageId", "parentPageId"
FROM "Page"
WHERE "slug" = 'home'
  AND "parentPageId" IS NOT NULL;

COMMIT;
