-- Update transactions to 'success' for orders that have been paid and confirmed
UPDATE transactions t
SET 
  status = 'success',
  payment_method = COALESCE(t.payment_method, 'mobile_money'),
  processed_at = COALESCE(t.processed_at, NOW())
FROM orders o
WHERE o.id = t.order_id 
  AND o.deposit_paid > 0 
  AND o.status IN ('confirmed', 'completed', 'in_progress')
  AND t.status = 'pending';