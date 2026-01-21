-- ============================================================
-- Admin & Employee Approval System - Database Migration
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- 1. Add role column to users table (existing users become 'admin' by default)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';

-- 2. Add approval workflow fields to finance_entries table
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. Create employees table (employees are managed by admin, linked to their admin)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security for employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Admins can manage their own employees
CREATE POLICY "Admins can view their employees" ON employees
    FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "Admins can insert employees" ON employees
    FOR INSERT WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can update their employees" ON employees
    FOR UPDATE USING (admin_id = auth.uid());

CREATE POLICY "Admins can delete their employees" ON employees
    FOR DELETE USING (admin_id = auth.uid());

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_admin_id ON employees(admin_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_finance_entries_approval_status ON finance_entries(approval_status);

-- 7. Update existing finance_entries to have 'approved' status and set created_by_name
UPDATE finance_entries 
SET approval_status = 'approved',
    created_by_name = COALESCE(
        (SELECT name FROM users WHERE users.id::text = finance_entries.user_id::text),
        'Unknown'
    )
WHERE approval_status IS NULL;

-- ============================================================
-- IMPORTANT: After running this migration:
-- 1. Your existing users will have 'admin' role
-- 2. All existing entries will be marked as 'approved'
-- 3. New employees added by admins will have 'employee' role
-- ============================================================
