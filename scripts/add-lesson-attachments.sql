CREATE TABLE IF NOT EXISTS "LessonAttachment" (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES "Lesson"(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  file_type TEXT NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  file_name TEXT,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "LessonAttachment_lesson_id_idx" ON "LessonAttachment"(lesson_id, "order");
