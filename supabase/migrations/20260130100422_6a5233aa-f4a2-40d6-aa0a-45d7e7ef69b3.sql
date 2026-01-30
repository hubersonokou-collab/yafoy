-- Add group_id column to link orders from the same event
ALTER TABLE orders ADD COLUMN group_id uuid;

-- Create index for efficient group lookups
CREATE INDEX idx_orders_group_id ON orders(group_id);