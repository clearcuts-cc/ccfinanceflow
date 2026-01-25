-- Migration v21: Fix Invoice Number Sequence
-- Create a function to auto-generate the next strictly sequential invoice number
-- This ensures Employees and Admins share the same sequence based on their Agency (admin_id).

CREATE OR REPLACE FUNCTION get_next_invoice_number(org_admin_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Find the highest existing invoice number for this agency and increment by 1
    RETURN (
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+') AS INTEGER)), 0) + 1
        FROM invoices
        WHERE admin_id = org_admin_id
    );
END;
$$;
