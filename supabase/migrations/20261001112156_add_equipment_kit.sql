/*
# Add equipment / kit management

1. New Tables
- `equipment`: a piece of gear shown on the Kit page.
  - `id` (uuid, primary key)
  - `kind` (text) — one of 'camera', 'lens', 'support'
  - `name` (text) — e.g. "35mm F2 Fujifilm"
  - `subtitle` (text) — short label line, e.g. "F2 · Fujifilm"
  - `usage` (text) — what it is used for
  - `image_url` (text) — product photo of the gear
  - `specs` (text[]) — short typewriter-style spec labels (mainly for the camera)
  - `sort_order` (int) — display order within its kind
  - `is_visible` (bool) — show on the public Kit page
  - `created_at` (timestamptz)

2. Modified Tables
- `project_images`: new nullable `equipment_id` referencing `equipment(id)` with
  `ON DELETE SET NULL`, so each photo can be tagged with the lens/gear it was shot on.
  Index added on `equipment_id`.

3. Security
- Enable RLS on `equipment`.
- Public (anon + authenticated) can read visible equipment; admins can read all.
- Only admins can insert, update or delete equipment (uses existing `is_admin()`).

4. Seed Data
- Seeds the real kit (Fujifilm X10 body and six prime lenses) only when the table is empty.

5. Content
- Adds Kit page + homepage-teaser content keys to `site_content` with sensible copy.
*/

CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'lens',
  name text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  usage text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  specs text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_equipment" ON equipment;
CREATE POLICY "public_select_equipment" ON equipment FOR SELECT
  TO anon, authenticated USING (is_visible OR is_admin());

DROP POLICY IF EXISTS "admin_insert_equipment" ON equipment;
CREATE POLICY "admin_insert_equipment" ON equipment FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_equipment" ON equipment;
CREATE POLICY "admin_update_equipment" ON equipment FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_equipment" ON equipment;
CREATE POLICY "admin_delete_equipment" ON equipment FOR DELETE
  TO authenticated USING (is_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_images' AND column_name = 'equipment_id'
  ) THEN
    ALTER TABLE project_images
      ADD COLUMN equipment_id uuid REFERENCES equipment(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS project_images_equipment_id_idx ON project_images (equipment_id);

INSERT INTO equipment (kind, name, subtitle, usage, specs, sort_order)
SELECT * FROM (VALUES
  ('camera', 'Fujifilm X10', 'The body', 'One compact body, primes only — no zooms to hide behind.', ARRAY['APS-C','PRIME ONLY','FILM SIM'], 0),
  ('lens', '16mm F1.4 Fujifilm', 'F1.4 · Fujifilm', 'Wide environmental frames — rooms, spaces and the feel of a place.', ARRAY[]::text[], 0),
  ('lens', '35mm F2 Fujifilm', 'F2 · Fujifilm', 'The everyday lens — reportage, people and natural storytelling.', ARRAY[]::text[], 1),
  ('lens', '56mm F1.2 Fujifilm', 'F1.2 · Fujifilm', 'Portraits with shallow, creamy depth and real subject separation.', ARRAY[]::text[], 2),
  ('lens', 'Viltrox Pro 27mm F1.2', 'Viltrox Pro · F1.2', 'A fast standard prime for low light and a classic field of view.', ARRAY[]::text[], 3),
  ('lens', 'Laowa 4mm Fisheye', 'Laowa · Fisheye', 'Circular ultra-wide for playful, immersive perspectives.', ARRAY[]::text[], 4),
  ('lens', '8mm Samyang Fisheye', 'Samyang · Fisheye', 'Dramatic wide fisheye for venues, crowds and events.', ARRAY[]::text[], 5)
) AS v(kind, name, subtitle, usage, specs, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM equipment);

INSERT INTO site_content (key, value, updated_at)
SELECT * FROM (VALUES
  ('kit_headline', to_jsonb('The *kit*'::text), now()),
  ('kit_intro', to_jsonb('Prime lenses only. One small body, a handful of fast primes and a reason for every one of them. This is what the work is shot on.'::text), now()),
  ('kit_camera_heading', to_jsonb('The body'::text), now()),
  ('kit_lenses_heading', to_jsonb('The *glass*'::text), now()),
  ('kit_support_heading', to_jsonb('Light & support'::text), now()),
  ('kit_cta_eyebrow', to_jsonb('Shot on primes'::text), now()),
  ('kit_cta_headline', to_jsonb('Want this kit on *your* project?'::text), now()),
  ('home_kit_heading', to_jsonb('Shot on *primes*'::text), now()),
  ('home_kit_blurb', to_jsonb('One body, six fast primes, and a reason for every frame.'::text), now())
) AS v(key, value, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM site_content s WHERE s.key = v.key);
