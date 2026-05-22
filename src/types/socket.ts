import type { CartEntry } from './cart';
import type { Order } from './order';

export interface ServerToClientEvents {
  cart_updated: (cart: CartEntry[]) => void;
  'order:status_updated': (data: { orderId: string; status: string }) => void;
  'session:replaced': (data?: { reason?: string }) => void;
  new_order_placed: (data: { orderId: string }) => void;
  new_order: (order: Order) => void;
  'order:updated': (order: Order) => void;
  'table:updated': (data: unknown) => void;
  'session:started': (data: { customer_name?: string; anyone_online?: boolean }) => void;
  'bill:requested': (data: { table_number: number; members?: string[] }) => void;
  'chat:message': (data: unknown) => void;
}

export interface ClientToServerEvents {
  [key: string]: (...args: unknown[]) => void;
}
