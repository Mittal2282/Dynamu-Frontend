import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { DEFAULT_BRAND } from '../utils/constants';

/**
 * Persisted store for restaurant + table data populated on QR session start.
 * Components can read branding, settings, and table info from here.
 */
export const restaurantStore = create(
  devtools(
    persist(
      (set) => ({
        // Restaurant
        id: null,
        name: '',
        slug: '',
        tagline: '',
        primaryColor:          DEFAULT_BRAND.primaryColor,
        secondaryColor:        DEFAULT_BRAND.secondaryColor,
        tertiaryColor:         DEFAULT_BRAND.tertiaryColor,
        neutralColor:          DEFAULT_BRAND.neutralColor,
        currency:              'INR',
        currencySymbol:        '₹',
        acceptsOnlinePayment:  false,
        aiWelcomeMessage:      '',

        // Table
        tableId:     null,
        tableNumber: null,
        tableName:   '',

        // ── Setters ──────────────────────────────────────────────────────────
        setRestaurant: (restaurant) =>
          set(() => ({
            id:                   restaurant.id,
            name:                 restaurant.name,
            slug:                 restaurant.slug,
            tagline:              restaurant.branding?.tagline         ?? '',
            primaryColor:         restaurant.branding?.primary_color   ?? DEFAULT_BRAND.primaryColor,
            secondaryColor:       restaurant.branding?.secondary_color ?? DEFAULT_BRAND.secondaryColor,
            tertiaryColor:        restaurant.branding?.tertiary_color  ?? DEFAULT_BRAND.tertiaryColor,
            neutralColor:         restaurant.branding?.neutral_color   ?? DEFAULT_BRAND.neutralColor,
            currency:             restaurant.settings?.currency         ?? 'INR',
            currencySymbol:       restaurant.settings?.currency_symbol  ?? '₹',
            acceptsOnlinePayment: restaurant.settings?.accepts_online_payment ?? false,
            aiWelcomeMessage:     restaurant.ai_config?.welcome_message ?? '',
          })),

        setTable: (table) =>
          set(() => ({
            tableId:     table.id,
            tableNumber: table.table_number,
            tableName:   table.name,
          })),

        reset: () =>
          set(() => ({
            id: null, name: '', slug: '', tagline: '',
            primaryColor:         DEFAULT_BRAND.primaryColor,
            secondaryColor:       DEFAULT_BRAND.secondaryColor,
            tertiaryColor:        DEFAULT_BRAND.tertiaryColor,
            neutralColor:         DEFAULT_BRAND.neutralColor,
            currency:             'INR',
            currencySymbol:       '₹',
            acceptsOnlinePayment: false,
            aiWelcomeMessage:     '',
            tableId: null, tableNumber: null, tableName: '',
          })),
      }),
      { name: 'RestaurantStore' }
    )
  )
);
