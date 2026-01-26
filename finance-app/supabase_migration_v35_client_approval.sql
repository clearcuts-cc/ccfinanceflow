-- ============================================================
-- Migration V35: Client Approval Workflow
-- ============================================================

-- 1. Add approval columns to clients table
-- We default 'approved' for existing clients so they don't disappear.
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- 2. Update existing clients to have 'approved' status if null
UPDATE public.clients 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;

-- 3. Fix RLS policies for clients to match Finance Entries logic
-- Admins must be able to DELETE clients created by their employees (for Decline action)

-- Drop existing restricted policies
DROP POLICY IF EXISTS "clients_delete" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;

-- Create comprehensive DELETE policy
CREATE POLICY "clients_delete_comprehensive" 
ON public.clients 
FOR DELETE 
TO authenticated 
USING (
    -- Creator can delete
    user_id = auth.uid() 
    OR 
    -- Admin of the client entry can delete (Critical for Decline)
    admin_id = auth.uid()
    OR
    -- Any Admin role user (Safety net)
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Create comprehensive UPDATE policy (for Approving)
CREATE POLICY "clients_update_comprehensive" 
ON public.clients 
FOR UPDATE 
TO authenticated 
USING (
    user_id = auth.uid() 
    OR 
    admin_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- 4. Create index for faster filtering of pending clients
CREATE INDEX IF NOT EXISTS idx_clients_approval_status ON public.clients(approval_status);
