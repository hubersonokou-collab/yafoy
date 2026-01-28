export type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type UserRole = 'client' | 'provider' | 'admin' | 'super_admin';

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
