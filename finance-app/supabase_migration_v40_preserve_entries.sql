-- ============================================================
-- Migration v40: Ensure entries are preserved when employee is deleted
-- This migration ensures that finance_entries, invoices, clients, and investments
-- created by employees are NOT deleted when the employee account is removed.
-- ============================================================

-- 1. Finance Entries - Change user_id to SET NULL on delete (preserve entries)
-- First drop the existing constraint if it exists, then recreate with ON DELETE SET NULL

-- Drop existing foreign key constraint on finance_entries.user_id if exists
DO $$
BEGIN
    -- Try to drop constraints that might exist
    ALTER TABLE finance_entries DROP CONSTRAINT IF EXISTS finance_entries_user_id_fkey;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop finance_entries_user_id_fkey constraint: %', SQLERRM;
END $$;

-- Re-add the constraint with ON DELETE SET NULL
DO $$
BEGIN
    ALTER TABLE finance_entries 
    ADD CONSTRAINT finance_entries_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add finance_entries_user_id_fkey constraint: %', SQLERRM;
END $$;

-- 2. Same for invoices table
DO $$
BEGIN
    ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_user_id_fkey;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop invoices_user_id_fkey constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add invoices_user_id_fkey constraint: %', SQLERRM;
END $$;

-- Same for created_by column in invoices
DO $$
BEGIN
    ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop invoices_created_by_fkey constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add invoices_created_by_fkey constraint: %', SQLERRM;
END $$;

-- 3. Same for investments table
DO $$
BEGIN
    ALTER TABLE investments DROP CONSTRAINT IF EXISTS investments_created_by_fkey;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop investments_created_by_fkey constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    ALTER TABLE investments 
    ADD CONSTRAINT investments_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add investments_created_by_fkey constraint: %', SQLERRM;
END $$;

-- 4. Same for clients table
DO $$
BEGIN
    ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop clients_user_id_fkey constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    ALTER TABLE clients 
    ADD CONSTRAINT clients_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add clients_user_id_fkey constraint: %', SQLERRM;
END $$;

-- 5. Notifications - also preserve when user deleted
DO $$
BEGIN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop notifications_user_id_fkey constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add notifications_user_id_fkey constraint: %', SQLERRM;
END $$;

-- ============================================================
-- SUMMARY: After running this migration, when an employee is deleted:
-- - Their finance_entries will remain (user_id becomes NULL)
-- - Their invoices will remain (user_id/created_by becomes NULL)
-- - Their investments will remain (created_by becomes NULL)
-- - Their clients will remain (user_id becomes NULL)
-- - Admin still has access via admin_id column
-- - created_by_name TEXT field still shows who created it
-- ============================================================
