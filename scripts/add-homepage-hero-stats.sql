-- Academy homepage: editable hero slides, stats ribbon, main nav flags
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS hero_slides_json TEXT;
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS stats_ribbon_json TEXT;
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS main_nav_flags_json TEXT;
