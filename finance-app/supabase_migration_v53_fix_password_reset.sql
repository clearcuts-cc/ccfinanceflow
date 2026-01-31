-- Migration V53: Fix Password Reset Logic for Employees
-- This migration ensures that employees cannot directly reset passwords 
-- and instead notify their admins.

-- 1. Ensure the employee check function has correct permissions
GRANT EXECUTE ON FUNCTION public.is_employee_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.is_employee_email(TEXT) TO authenticated;

-- 2. Ensure the notification function has correct permissions
GRANT EXECUTE ON FUNCTION public.request_employee_password_reset_notification(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.request_employee_password_reset_notification(TEXT) TO authenticated;

-- 3. Update the notification function to be more robust
CREATE OR REPLACE FUNCTION public.request_employee_password_reset_notification(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_admin_id uuid;
    v_user_name text;
BEGIN
    -- 1. Find the user (employee) in the users table
    SELECT id, admin_id, name INTO v_user_id, v_admin_id, v_user_name
    FROM users
    WHERE email = target_email
    LIMIT 1;

    -- If no user found in users table, check employees table specifically
    IF v_user_id IS NULL THEN
        SELECT user_id, admin_id, name INTO v_user_id, v_admin_id, v_user_name
        FROM employees
        WHERE email = target_email
        LIMIT 1;
    END IF;

    -- If still no user found or no admin linked, we can't send a notification
    IF v_user_id IS NULL OR v_admin_id IS NULL THEN
        RETURN false;
    END IF;

    -- 2. Check if a pending request already exists to prevent spam (last 1 hour)
    IF EXISTS (
        SELECT 1 FROM notifications 
        WHERE admin_id = v_admin_id 
          AND type = 'password_reset_request' 
          AND metadata->>'email' = target_email
          AND created_at > (now() - interval '1 hour')
          AND is_read = false
    ) THEN
        RETURN true; -- Already notified recently
    END IF;

    -- 3. Insert Notification for the Admin
    INSERT INTO notifications (
        admin_id,
        title,
        message,
        type,
        metadata,
        is_read,
        created_at
    ) VALUES (
        v_admin_id,
        'Password Reset Request',
        coalesce(v_user_name, 'Employee') || ' (' || target_email || ') requested a password reset. Please provide them with new credentials.',
        'password_reset_request',
        jsonb_build_object('email', target_email, 'name', v_user_name),
        false,
        now()
    );

    RETURN true;
END;
$$;
