export type OrderStatus =
  | 'pending' | 'confirmed' | 'preparing'
  | 'ready' | 'served' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  is_veg?: boolean | null;
  image_url?: string;
  variant_name?: string;
  variant_group?: string;
  special_instructions?: string;
  menu_item?: string | Record<string, unknown>;
}

export interface Order {
  _id: string;
  order_number: number;
  status: OrderStatus;
  payment_status?: PaymentStatus;
  items: OrderItem[];
  subtotal?: number;
  tax_amount?: number;
  service_charge?: number;
  total_amount: number;
  table?: { _id?: string; table_number?: number | string } | string;
  table_number?: number | string;
  session?: string;
  customer_name?: string;
  source?: string;
  is_addon?: boolean;
  estimated_prep_time?: number;
  createdAt?: string;
}
