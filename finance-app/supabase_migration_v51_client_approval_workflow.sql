-- Migration V51: Client Edit/Delete Approval Workflow
-- Adds support for employees to request editing or deleting clients

-- 1. Add request-related columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS deletion_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS edit_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edit_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS pending_changes JSONB;

-- 2. Update RLS policies to allow employees to update these specific columns
-- We've already got comprehensive policies, but let's ensure they are correct.
-- The existing "clients_update_comprehensive" should allow this.
