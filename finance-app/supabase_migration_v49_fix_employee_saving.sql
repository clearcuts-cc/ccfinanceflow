-- Migration V49: Fix Employee and User Saving Permissions
-- Restores admin management capabilities on employees and users tables
-- Fixes "new row violates row-level security policy for table 'employees'"

-- 1. FIX EMPLOYEES TABLE POLICIES
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop conflicting or incomplete policies from v45
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
DROP POLICY IF EXISTS "employees_select" ON public.employees;
DROP POLICY IF EXISTS "employees_update" ON public.employees;
DROP POLICY IF EXISTS "employees_delete" ON public.employees;
DROP POLICY IF EXISTS "Employees can view own profile" ON public.employees;
DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON public.employees;

-- CREATE NEW COMPREHENSIVE POLICIES FOR EMPLOYEES
-- SELECT: Admin sees their team, Employees see themselves
CREATE POLICY "employees_select_policy" ON public.employees FOR SELECT 
TO authenticated 
USING (
    admin_id = (SELECT auth.uid()) OR 
    user_id = (SELECT auth.uid())
);

-- INSERT: Only Admins can add employees (admin_id must match their own ID)
CREATE POLICY "employees_insert_policy" ON public.employees FOR INSERT 
TO authenticated 
WITH CHECK (admin_id = (SELECT auth.uid()));

-- UPDATE/DELETE: Only Admins can modify their employees
CREATE POLICY "employees_update_policy" ON public.employees FOR UPDATE 
TO authenticated 
USING (admin_id = (SELECT auth.uid()));

CREATE POLICY "employees_delete_policy" ON public.employees FOR DELETE 
TO authenticated 
USING (admin_id = (SELECT auth.uid()));


-- 2. FIX USERS TABLE POLICIES (Allow Admin to create employee profiles)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;

-- Allow users to insert their own profile (Signup) OR Admins to insert employee profiles
CREATE POLICY "users_insert_policy" ON public.users FOR INSERT 
TO authenticated 
WITH CHECK (
    id = (SELECT auth.uid()) OR 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
);

-- Ensure updated settings for employees
GRANT ALL ON TABLE public.employees TO authenticated;
GRANT ALL ON TABLE public.users TO authenticated;
