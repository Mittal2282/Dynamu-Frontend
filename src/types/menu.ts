export interface Variant {
  name: string;
  price: number;
  discount_percentage?: number;
  isVeg?: boolean | null;
  isAvailable?: boolean;
  groupName?: string;
}

export interface VariantGroup {
  name: string;
  variants: Variant[];
}

export interface MenuItem {
  _id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  is_veg?: boolean | null;
  is_available?: boolean;
  image_url?: string;
  discount_percentage?: number;
  spice_level?: number;
  has_variants?: boolean;
  variants?: Variant[];
  variant_groups?: VariantGroup[];
  is_popular?: boolean;
  is_featured?: boolean;
  is_chefs_special?: boolean;
  order_count?: number;
  blocked_by_ingredients?: string[];
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  tags?: string[];
  ingredients?: string[] | string;
  allergens?: string[] | string;
  preparation_time?: number | string;
  serves?: number | string;
  display_order?: number | string;
  gst_slab?: number;
  meal_tag?: string;
  taste_profile?: string;
  is_combo?: boolean;
  combo_discount?: number;
}
