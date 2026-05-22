export interface RestaurantBranding {
  primary_color?: string;
  secondary_color?: string;
  theme?: number;
  logo_url?: string;
  tagline?: string;
}

export interface RestaurantSettings {
  currency?: string;
  currency_symbol?: string;
  tax_percentage?: number;
  service_charge_percentage?: number;
  enforce_proximity?: boolean;
  proximity_radius_m?: number;
  accepts_online_payment?: boolean;
}

export interface RestaurantAIConfig {
  welcome_message?: string;
  personality?: string;
}

export interface Restaurant {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  branding?: RestaurantBranding;
  settings?: RestaurantSettings;
  ai_config?: RestaurantAIConfig;
}

export interface TableData {
  _id: string;
  id?: string;
  table_number: number;
  name?: string;
  display_status: string;
  floor?: number;
  floor_name?: string;
  is_active?: boolean;
  is_serviceable?: boolean;
  session?: Record<string, unknown> | null;
  qr_code_id?: string;
}
