-- ============================================================
-- Migration v19: Fix Performance Warning - Duplicate Policies
-- ============================================================

-- ------------------------------------------------------------
-- 1. Remove Redundant Policies on invoice_services
-- ------------------------------------------------------------
-- Supabase reports "Multiple Permissive Policies" for INSERT and SELECT.
-- We recently created "invoice_services_select" and "invoice_services_insert" with correct logic.
-- We must remove the old, vaguely named ones that are now duplicates.

DROP POLICY IF EXISTS "Users can insert invoice services" ON invoice_services;
DROP POLICY IF EXISTS "Allow authenticated users to read invoice services" ON invoice_services;

-- ------------------------------------------------------------
-- 2. Verify Cleanup on invoices (Just in case)
-- ------------------------------------------------------------
-- Checking for potential duplicates on the parent table too, to remain proactive.
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices; 
DROP POLICY IF EXISTS "Allow authenticated users to read invoices" ON invoices;

-- The new policies "invoices_insert" and "invoices_select" will remain active.
