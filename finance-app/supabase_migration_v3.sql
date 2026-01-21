-- ============================================================
-- Additional Migration: Add plain_password to employees
-- Run this SQL in your Supabase SQL Editor
--
-- SECURITY WARNING: Storing plain text passwords is not recommended.
-- This is implemented per specific user request to allow admins to view passwords.
-- ============================================================

-- 1. Add plain_password column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS plain_password TEXT;

-- 2. Update existing employees (optional - set a placeholder if needed)
-- UPDATE employees SET plain_password = 'unknown' WHERE plain_password IS NULL;

-- Note: Only the admin who created the employee can see this due to existing RLS policies.
