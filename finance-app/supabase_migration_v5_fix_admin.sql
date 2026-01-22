-- ============================================================
-- Migration v5: Fix Admin Accounts & Role Detection
-- Run this SQL in your Supabase SQL Editor
--
-- This migration fixes issues where admin accounts created directly
-- in Supabase Auth don't appear correctly in the app.
-- ============================================================

-- Step 1: Drop all existing policies on users table (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Enable insert for users" ON users;
DROP POLICY IF EXISTS "Enable update for users" ON users;

-- Step 2: Drop the old users table completely
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Create users table with correct UUID type
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'employee')),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

-- 4. Insert missing user records for existing auth users (as admins)
-- This creates user profiles for accounts created directly in Supabase Auth
INSERT INTO users (id, email, name, role, is_verified, created_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', SPLIT_PART(au.email, '@', 1)) as name,
    COALESCE(au.raw_user_meta_data->>'role', 'admin') as role,
    au.email_confirmed_at IS NOT NULL as is_verified,
    au.created_at
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = au.id);

-- 5. Ensure admin_id is set for all finance entries owned by admins
UPDATE finance_entries 
SET admin_id = user_id 
WHERE admin_id IS NULL 
AND user_id IN (SELECT id FROM users WHERE role = 'admin');

-- 6. Update created_by_name for entries where it's missing
UPDATE finance_entries 
SET created_by_name = COALESCE(
    (SELECT name FROM users WHERE users.id = finance_entries.user_id),
    'Unknown'
)
WHERE created_by_name IS NULL OR created_by_name = '';

-- ============================================================
-- VERIFICATION QUERIES (Run these to check the results)
-- ============================================================

-- Check users table
-- SELECT id, email, name, role, is_verified FROM users;

-- Check finance entries with proper admin_id
-- SELECT id, client_name, user_id, admin_id, approval_status, created_by_name FROM finance_entries;

-- ============================================================
-- NOTE: After running this migration:
-- 1. All existing auth users will have entries in the users table
-- 2. Users without employee metadata will be treated as admins
-- 3. All entries will have proper admin_id set
-- ============================================================
