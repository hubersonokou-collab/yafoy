-- Drop the existing constraint and add a new one that includes 'success'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'success'::text, 'failed'::text, 'cancelled'::text]));