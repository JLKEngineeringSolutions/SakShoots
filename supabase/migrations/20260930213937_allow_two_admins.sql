/*
# Allow up to two admin accounts

1. Changes
- New function `public.admin_slots_remaining()` returns how many admin accounts can still be
  created (2 minus the current number of admins, never below 0). Used by the login screen to
  decide whether to offer "Create admin account".
- `public.claim_first_admin()` now grants admin access to the signed-in user only while fewer
  than 2 admins exist. It still locks the `admins` table so two simultaneous signups cannot
  both take the last slot. If the caller is already an admin it returns true.
- Removes `public.admin_setup_available()`, which is replaced by `admin_slots_remaining()`.

2. Security
- `admin_slots_remaining()` is callable by anon and authenticated (it only reveals a count).
- `claim_first_admin()` remains executable by authenticated users only.
*/

CREATE OR REPLACE FUNCTION public.admin_slots_remaining()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, 2 - (SELECT count(*) FROM admins))::integer;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_slots_remaining() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_slots_remaining() TO anon, authenticated;

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
  IF EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RETURN true;
  END IF;
  IF (SELECT count(*) FROM admins) >= 2 THEN
    RETURN false;
  END IF;
  INSERT INTO admins (user_id) VALUES (auth.uid());
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

DROP FUNCTION IF EXISTS public.admin_setup_available();
