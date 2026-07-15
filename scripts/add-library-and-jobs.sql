CREATE TABLE IF NOT EXISTS "LibraryCategory" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES "LibraryCategory"(id) ON DELETE SET NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES "LibraryCategory"(id) ON DELETE SET NULL;
ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'file';
ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS article_body TEXT;

CREATE TABLE IF NOT EXISTS "JobPosting" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT NOT NULL DEFAULT '',
  description_ar TEXT,
  location TEXT,
  job_type TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "JobPosting_published_order_idx" ON "JobPosting"(is_published, "order");
