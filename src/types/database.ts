export type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type UserRole = 'client' | 'provider' | 'admin' | 'super_admin' | 'accountant' | 'supervisor' | 'moderator' | 'support';

export type TransactionType = 'payment' | 'commission' | 'withdrawal' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'mobile_money' | 'card' | 'cash' | 'bank_transfer';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type ReportType = 'fake_account' | 'inappropriate_content' | 'fraud' | 'harassment' | 'spam' | 'other';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'account' | 'order' | 'payment' | 'technical' | 'other';

export interface Transaction {
  id: string;
  order_id: string | null;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  payment_method: PaymentMethod | null;
  provider_id: string | null;
  description: string | null;
  reference: string | null;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

export interface Withdrawal {
  id: string;
  provider_id: string;
  amount: number;
  status: WithdrawalStatus;
  payment_method: 'mobile_money' | 'bank_transfer';
  account_details: Record<string, unknown>;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  rejection_reason: string | null;
  notes: string | null;
  provider?: {
    full_name: string | null;
    phone: string | null;
  };
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_product_id: string | null;
  type: ReportType;
  description: string | null;
  status: ReportStatus;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  reporter?: {
    full_name: string | null;
  };
  reported_user?: {
    full_name: string | null;
  };
  reported_product?: {
    name: string;
  };
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string | null;
    phone: string | null;
  };
  assignee?: {
    full_name: string | null;
  };
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  sender?: {
    full_name: string | null;
  };
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  provider_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_per_day: number;
  deposit_amount: number;
  quantity_available: number;
  images: string[];
  location: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  provider?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Order {
  id: string;
  client_id: string;
  provider_id: string;
  status: OrderStatus;
  total_amount: number;
  deposit_paid: number;
  event_date: string | null;
  event_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    full_name: string | null;
    phone: string | null;
  };
  provider?: {
    full_name: string | null;
  };
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_per_day: number;
  rental_days: number;
  subtotal: number;
  created_at: string;
  product?: Product;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}
