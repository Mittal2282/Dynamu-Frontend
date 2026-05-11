import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { DEFAULT_THEME_NUMBER } from '../utils/constants';
import type { MenuItem } from '../types/menu';
import type { Restaurant, TableData } from '../types/restaurant';

/**
 * Persisted store for restaurant + table data populated on QR session start.
 * Components can read branding, settings, and table info from here.
 *
 * The `themeNumber` field (1–4) drives the entire color system via useTheme.
 * Full theme definitions are in src/theme/tokens.js.
 */

interface RestaurantState {
  // Restaurant
  id: string | null;
  name: string;
  slug: string;
  tagline: string;
  themeNumber: number;
  currency: string;
  currencySymbol: string;
  acceptsOnlinePayment: boolean;
  aiWelcomeMessage: string;
  enforceProximity: boolean;

  // Table
  tableId: string | null;
  tableNumber: number | string | null;
  tableName: string;
  tableFloor: number | null;
  tableFloorName: string;

  /** Menu categories → items (session; not persisted — see partialize) */
  menu: Record<string, MenuItem[]>;

  // Setters
  setRestaurant: (restaurant: Restaurant) => void;
  setTable: (table: TableData) => void;
  setMenu: (menu: Record<string, MenuItem[]>) => void;
  reset: () => void;
}

export const restaurantStore = create<RestaurantState>()(
  devtools(
    persist(
      (set) => ({
        // Restaurant
        id: null,
        name: '',
        slug: '',
        tagline: '',
        themeNumber:           DEFAULT_THEME_NUMBER,
        currency:              'INR',
        currencySymbol:        '₹',
        acceptsOnlinePayment:  false,
        aiWelcomeMessage:      '',
        enforceProximity:      true,

        // Table
        tableId:        null,
        tableNumber:    null,
        tableName:      '',
        tableFloor:     null,
        tableFloorName: '',

        /** Menu categories → items (session; not persisted — see partialize) */
        menu: {},

        // ── Setters ──────────────────────────────────────────────────────────
        setRestaurant: (restaurant) =>
          set(() => ({
            id:                   restaurant.id,
            name:                 restaurant.name,
            slug:                 restaurant.slug ?? '',
            tagline:              restaurant.branding?.tagline              ?? '',
            themeNumber:          Number(restaurant.branding?.theme) || DEFAULT_THEME_NUMBER,
            currency:             restaurant.settings?.currency              ?? 'INR',
            currencySymbol:       restaurant.settings?.currency_symbol       ?? '₹',
            acceptsOnlinePayment: restaurant.settings?.accepts_online_payment ?? false,
            aiWelcomeMessage:     restaurant.ai_config?.welcome_message       ?? '',
            enforceProximity:     restaurant.settings?.enforce_proximity !== false,
          })),

        setTable: (table) =>
          set(() => ({
            tableId:        table.id ?? table._id ?? null,
            tableNumber:    table.table_number,
            tableName:      table.name ?? '',
            tableFloor:     table.floor ?? null,
            tableFloorName: table.floor_name ?? '',
          })),

        setMenu: (menu) => set(() => ({ menu: menu && typeof menu === 'object' ? menu : {} })),

        reset: () =>
          set(() => ({
            id: null, name: '', slug: '', tagline: '',
            themeNumber:          DEFAULT_THEME_NUMBER,
            currency:             'INR',
            currencySymbol:       '₹',
            acceptsOnlinePayment: false,
            aiWelcomeMessage:     '',
            enforceProximity:     true,
            tableId: null, tableNumber: null, tableName: '', tableFloor: null, tableFloorName: '',
            menu: {},
          })),
      }),
      {
        name: 'RestaurantStore',
        partialize: (state) => {
          const { menu: _m, ...rest } = state;
          return rest;
        },
      }
    )
  )
);
