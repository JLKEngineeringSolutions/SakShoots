/*
# Content management system for Sak Shoots

Plain English: stores every piece of editable site content (text, images, portfolio
categories, projects, project photos, service tiers) so the owner can manage the site
from /admin. Anyone can read published content; only admins can change it.

1. New Tables
- `admins` — who may edit content
  - `user_id` (uuid, PK, references auth.users)
  - `created_at`
- `site_content` — key/value store for page copy, images and links
  - `key` (text, PK), `value` (jsonb), `updated_at`
- `categories` — portfolio disciplines
  - `id`, `slug` (unique), `name`, `lens`, `blurb`, `cover_url`, `sort_order`, `is_visible`, `created_at`
- `projects` — collections inside a category
  - `id`, `category_id` (FK categories, cascade), `slug`, `title`, `place`, `brief`, `lens`, `year`,
    `sort_order`, `is_visible`, `is_featured`, `featured_tag`, `created_at`; unique (category_id, slug)
- `project_images` — photos in a project
  - `id`, `project_id` (FK projects, cascade), `url`, `sort_order`, `created_at`
- `service_tiers` — pricing cards (also used for "What I shoot" on the home page)
  - `id`, `title`, `lens`, `price`, `badge`, `summary`, `features` (text[]), `is_featured`, `sort_order`, `created_at`

2. Functions
- `is_admin()` — true when the signed-in user is listed in `admins`
- `admin_setup_available()` — true while no admin exists yet (lets the first account be created)
- `claim_first_admin()` — makes the caller the admin, only if no admin exists yet

3. Security
- RLS enabled on all new tables.
- Public (anon + authenticated) can read content; hidden categories/projects are only readable by admins.
- Insert/update/delete restricted to admins via `is_admin()`.
- `enquiries`: admins can now read and delete submissions.
- Storage bucket `media` (public read) — only admins can upload, replace or delete files.

4. Notes
1. Single owner site: the very first account created at /admin becomes the admin; after that
   setup is closed and new accounts get no editing rights.
*/

CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.admin_setup_available()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM admins);
$$;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  LOCK TABLE admins IN EXCLUSIVE MODE;
  IF EXISTS (SELECT 1 FROM admins) THEN
    RETURN EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
  END IF;
  INSERT INTO admins (user_id) VALUES (auth.uid());
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_setup_available() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_setup_available() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

DROP POLICY IF EXISTS "admins_select_self" ON admins;
CREATE POLICY "admins_select_self" ON admins FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '""'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  lens text NOT NULL DEFAULT '',
  blurb text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  place text NOT NULL DEFAULT '',
  brief text NOT NULL DEFAULT '',
  lens text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  featured_tag text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
CREATE INDEX IF NOT EXISTS projects_category_idx ON projects(category_id);

CREATE TABLE IF NOT EXISTS project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_images_project_idx ON project_images(project_id);

CREATE TABLE IF NOT EXISTS service_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  lens text NOT NULL DEFAULT '',
  price text NOT NULL DEFAULT '',
  badge text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}',
  is_featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tiers ENABLE ROW LEVEL SECURITY;

-- site_content
DROP POLICY IF EXISTS "public_select_site_content" ON site_content;
CREATE POLICY "public_select_site_content" ON site_content FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_insert_site_content" ON site_content;
CREATE POLICY "admin_insert_site_content" ON site_content FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_site_content" ON site_content;
CREATE POLICY "admin_update_site_content" ON site_content FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_site_content" ON site_content;
CREATE POLICY "admin_delete_site_content" ON site_content FOR DELETE
  TO authenticated USING (public.is_admin());

-- categories
DROP POLICY IF EXISTS "public_select_categories" ON categories;
CREATE POLICY "public_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (is_visible OR public.is_admin());
DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (public.is_admin());

-- projects
DROP POLICY IF EXISTS "public_select_projects" ON projects;
CREATE POLICY "public_select_projects" ON projects FOR SELECT
  TO anon, authenticated USING (
    public.is_admin() OR (
      is_visible AND EXISTS (SELECT 1 FROM categories c WHERE c.id = projects.category_id AND c.is_visible)
    )
  );
DROP POLICY IF EXISTS "admin_insert_projects" ON projects;
CREATE POLICY "admin_insert_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_projects" ON projects;
CREATE POLICY "admin_update_projects" ON projects FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_projects" ON projects;
CREATE POLICY "admin_delete_projects" ON projects FOR DELETE
  TO authenticated USING (public.is_admin());

-- project_images
DROP POLICY IF EXISTS "public_select_project_images" ON project_images;
CREATE POLICY "public_select_project_images" ON project_images FOR SELECT
  TO anon, authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM projects p JOIN categories c ON c.id = p.category_id
      WHERE p.id = project_images.project_id AND p.is_visible AND c.is_visible
    )
  );
DROP POLICY IF EXISTS "admin_insert_project_images" ON project_images;
CREATE POLICY "admin_insert_project_images" ON project_images FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_project_images" ON project_images;
CREATE POLICY "admin_update_project_images" ON project_images FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_project_images" ON project_images;
CREATE POLICY "admin_delete_project_images" ON project_images FOR DELETE
  TO authenticated USING (public.is_admin());

-- service_tiers
DROP POLICY IF EXISTS "public_select_service_tiers" ON service_tiers;
CREATE POLICY "public_select_service_tiers" ON service_tiers FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_insert_service_tiers" ON service_tiers;
CREATE POLICY "admin_insert_service_tiers" ON service_tiers FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_service_tiers" ON service_tiers;
CREATE POLICY "admin_update_service_tiers" ON service_tiers FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_service_tiers" ON service_tiers;
CREATE POLICY "admin_delete_service_tiers" ON service_tiers FOR DELETE
  TO authenticated USING (public.is_admin());

-- enquiries: admins can review and remove
DROP POLICY IF EXISTS "admin_select_enquiries" ON enquiries;
CREATE POLICY "admin_select_enquiries" ON enquiries FOR SELECT
  TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_enquiries" ON enquiries;
CREATE POLICY "admin_delete_enquiries" ON enquiries FOR DELETE
  TO authenticated USING (public.is_admin());

-- storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "admin_insert_media" ON storage.objects;
CREATE POLICY "admin_insert_media" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'media' AND public.is_admin());
DROP POLICY IF EXISTS "admin_update_media" ON storage.objects;
CREATE POLICY "admin_update_media" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'media' AND public.is_admin())
  WITH CHECK (bucket_id = 'media' AND public.is_admin());
DROP POLICY IF EXISTS "admin_delete_media" ON storage.objects;
CREATE POLICY "admin_delete_media" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'media' AND public.is_admin());
