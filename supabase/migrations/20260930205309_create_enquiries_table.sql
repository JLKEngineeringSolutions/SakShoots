/*
# Create enquiries table (single-tenant, no auth)

1. New Tables
- `enquiries`
  - `id` (uuid, primary key)
  - `name` (text, not null) — the enquirer's name
  - `email` (text, not null) — the enquirer's email
  - `business` (text, nullable) — optional business/venue name
  - `ideal_date` (text, nullable) — optional preferred date (free text)
  - `project_type` (text, nullable) — selected service type chip
  - `budget` (text, nullable) — selected budget range chip
  - `brief` (text, nullable) — free-text project description
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `enquiries`.
- Allow anon + authenticated INSERT only (public contact form).
- No SELECT/UPDATE/DELETE from the frontend — enquiries are private to the site owner.
*/

CREATE TABLE IF NOT EXISTS enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  business text,
  ideal_date text,
  project_type text,
  budget text,
  brief text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_enquiries" ON enquiries;
CREATE POLICY "anon_insert_enquiries" ON enquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);
