-- ============================================================
-- Additional Migration: Add admin_id to finance_entries
-- Run this SQL in your Supabase SQL Editor AFTER the first migration
-- ============================================================

-- 1. Add admin_id column to finance_entries
-- This links employee entries to their admin for data visibility
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- 2. Update existing entries: set admin_id = user_id for all current entries
-- (All existing entries belong to admins/the main user)
UPDATE finance_entries 
SET admin_id = user_id 
WHERE admin_id IS NULL;

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_finance_entries_admin_id ON finance_entries(admin_id);

-- ============================================================
-- NOTE: After running this migration:
-- - All existing entries will have admin_id = user_id (current owner)
-- - New employee entries will have admin_id set to their admin's ID
-- - Admins can see all entries where admin_id = their ID
-- ============================================================
