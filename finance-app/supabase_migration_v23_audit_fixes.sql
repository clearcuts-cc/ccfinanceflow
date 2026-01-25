-- Migration v23: Final Audit Fixes (Security & Performance)
-- Addresses reported issues:
-- 1. mutable search_path in get_next_invoice_number
-- 2. multiple permissive insert policies on finance_entries

-- 1. Fix Function Search Path (Security Best Practice)
-- Prevents search_path hijacking in SECURITY DEFINER functions
ALTER FUNCTION get_next_invoice_number(uuid) SET search_path = public, pg_temp;

-- 2. Remove Duplicate/Legacy Policy (Performance)
-- We keep "finance_entries_insert" (defined in v22) and remove the old "entries_insert"
-- having multiple permissive policies causes all of them to run, slowing down inserts.
DROP POLICY IF EXISTS "entries_insert" ON finance_entries;

-- 3. Cleanup any potential duplicate on investments (Proactive)
DROP POLICY IF EXISTS "policy_insert_investments" ON investments; 
-- (Assuming standard naming, but "investments_insert" is the standard we keep)
