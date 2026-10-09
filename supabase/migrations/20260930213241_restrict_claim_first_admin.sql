/*
# Restrict first-admin claim to signed-in users

1. Security
- Revoke EXECUTE on `public.claim_first_admin()` from PUBLIC and `anon`.
- Keep EXECUTE for `authenticated` (needed during first-time admin setup).

2. Notes
- `is_admin()` and `admin_setup_available()` intentionally remain callable by `anon`:
  `is_admin()` is referenced by public read policies, and `admin_setup_available()`
  only returns whether the one-time setup screen should be shown.
*/

REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
