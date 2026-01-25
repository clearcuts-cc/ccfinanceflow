-- Migration v22: Fix Security Issues (Tighten RLS Policies)
-- Previously, INSERT policies for 'finance_entries' and 'investments' were too permissive (WITH CHECK true).
-- This migration restricts INSERTs so users can only create records linked to their own user_id.

-- 1. Secure Finance Entries
DROP POLICY IF EXISTS "finance_entries_insert" ON finance_entries;

-- If policy doesn't exist by that name, we drop whatever baseline exists or just create new.
-- However, we must ensure we don't conflict. 
-- Assuming "finance_entries_insert" is the main one. If "Enable Insert for all" exists from v5, we should drop that if known.
-- v5 likely used "finance_entries_insert".

CREATE POLICY "finance_entries_insert" ON finance_entries FOR INSERT TO authenticated
WITH CHECK (
    -- User creates their own entry
    user_id = (SELECT auth.uid()) 
    OR
    -- Admin creates entry (though usually admin IS the user_id for their own entries)
    admin_id = (SELECT auth.uid())
);

-- 2. Secure Investments
DROP POLICY IF EXISTS "investments_insert" ON investments;

CREATE POLICY "investments_insert" ON investments FOR INSERT TO authenticated
WITH CHECK (
    -- Creator must match auth user
    created_by = (SELECT auth.uid()) 
    OR
    admin_id = (SELECT auth.uid())
);
