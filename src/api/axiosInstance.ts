import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { authStore } from '../store/authStore';
import { locationStore } from '../store/locationStore';
import { restaurantStore } from '../store/restaurantStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const LOCATION_MAX_AGE_MS = 55_000; // keep a few seconds below the server's 60s window

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach session token + fresh geolocation headers ─────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const { sessionToken } = authStore.getState();
  if (sessionToken) {
    config.headers.Authorization = `Bearer ${sessionToken}`;
  }

  // If the restaurant has disabled proximity enforcement, do not send customer location headers.
  const enforceProximity = restaurantStore.getState().enforceProximity !== false;

  const { latitude, longitude, accuracy_m, captured_at } = locationStore.getState();
  if (
    enforceProximity &&
    latitude != null && longitude != null && captured_at &&
    Date.now() - captured_at < LOCATION_MAX_AGE_MS
  ) {
    config.headers['x-customer-lat']      = String(latitude);
    config.headers['x-customer-lng']      = String(longitude);
    config.headers['x-customer-accuracy'] = String(Math.round(accuracy_m || 0));
    config.headers['x-customer-ts']       = String(captured_at);
  }

  return config;
});

// ── Response: handle OUT_OF_RANGE + LOCATION_REQUIRED ─────────────────────
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError<{ code?: string; details?: Record<string, unknown> }>) => {
    const status = error.response?.status;
    const code   = error.response?.data?.code;

    // Hard stop — session ended server-side for being out of range
    if (status === 403 && code === 'OUT_OF_RANGE') {
      const details = (error.response?.data?.details as Record<string, unknown>) || {};
      authStore.getState().resetAuth();
      locationStore.getState().stop();

      // Stash the details so OutOfRangeScreen can read them
      try {
        sessionStorage.setItem('outOfRangeDetails', JSON.stringify({
          distance_m: details.distance_m,
          radius_m:   details.radius_m,
          restaurant_name: details.restaurant_name || '',
          at: Date.now(),
        }));
      } catch { /* storage quota, ignore */ }

      if (typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/customer/out-of-range')) {
        window.location.replace('/customer/out-of-range');
      }
      return Promise.reject(error);
    }

    // Fresh GPS missing — try once to refresh and retry
    const config = error.config as (typeof error.config & { __geoRetried?: boolean });
    if (status === 403 && code === 'LOCATION_REQUIRED' && !config?.__geoRetried) {
      try {
        await locationStore.getState().ensureFresh(15_000);
        config.__geoRetried = true;
        return api.request(config);
      } catch {
        try {
          sessionStorage.setItem('locationRequiredAt', String(Date.now()));
        } catch { /* ignore */ }
        if (typeof window !== 'undefined' &&
            !window.location.pathname.startsWith('/customer/location-required') &&
            !window.location.pathname.startsWith('/customer/out-of-range')) {
          window.location.replace('/customer/location-required');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
