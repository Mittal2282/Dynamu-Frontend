import type { Variant } from './menu';

export interface CartEntry {
  _id: string;
  _cartKey?: string;
  name: string;
  price: number;
  qty: number;
  instruction?: string;
  is_veg?: boolean | null;
  image_url?: string;
  discount_percentage?: number;
  selectedVariant?: Variant & { groupName?: string; _cartKey?: string };
  menu_item?: string;
}

export interface SyncCartItem {
  _id: string;
  quantity: number;
  instruction?: string;
  variant_name?: string;
  variant_group?: string;
  variant_price?: number;
  variant_is_veg?: boolean | null;
}
