import { create } from 'zustand';

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 30_000,
  timeout: 15_000,
};

const isSupported = typeof navigator !== 'undefined' && !!navigator.geolocation;

let watchId = null;

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!isSupported) {
      reject(new Error('UNSUPPORTED'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS);
  });

export const locationStore = create((set, get) => ({
  latitude: null,
  longitude: null,
  accuracy_m: null,
  captured_at: null,
  permissionState: isSupported ? 'prompt' : 'unsupported',
  isWatching: false,
  lastError: null,

  setPermissionState: (permissionState) => set({ permissionState }),

  _writeCoords: (position) => {
    set({
      latitude:   position.coords.latitude,
      longitude:  position.coords.longitude,
      accuracy_m: position.coords.accuracy ?? 0,
      captured_at: Date.now(),
      permissionState: 'granted',
      lastError: null,
    });
  },

  _writeError: (err) => {
    const next = { lastError: err };
    if (err && err.code === 1) next.permissionState = 'denied'; // PERMISSION_DENIED
    set(next);
  },

  start: () => {
    if (!isSupported) {
      set({ permissionState: 'unsupported' });
      return;
    }
    if (get().isWatching) return;

    watchId = navigator.geolocation.watchPosition(
      (pos) => get()._writeCoords(pos),
      (err) => get()._writeError(err),
      GEO_OPTIONS,
    );
    set({ isWatching: true });
  },

  stop: () => {
    if (watchId != null) {
      try { navigator.geolocation.clearWatch(watchId); } catch { /* noop */ }
      watchId = null;
    }
    set({ isWatching: false });
  },

  reset: () => {
    if (watchId != null) {
      try { navigator.geolocation.clearWatch(watchId); } catch { /* noop */ }
      watchId = null;
    }
    set({
      latitude: null,
      longitude: null,
      accuracy_m: null,
      captured_at: null,
      isWatching: false,
      lastError: null,
    });
  },

  /**
   * Resolve a location that is at most `maxAgeMs` milliseconds old.
   * If the store already has a fresh fix, return it. Otherwise perform a
   * one-shot getCurrentPosition and commit the result.
   */
  ensureFresh: async (maxAgeMs = 30_000) => {
    const { latitude, longitude, accuracy_m, captured_at } = get();
    if (latitude != null && longitude != null && captured_at &&
        Date.now() - captured_at < maxAgeMs) {
      return { latitude, longitude, accuracy_m, captured_at };
    }
    try {
      const pos = await getCurrentPosition();
      get()._writeCoords(pos);
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy ?? 0,
        captured_at: Date.now(),
      };
    } catch (err) {
      get()._writeError(err);
      throw err;
    }
  },
}));
