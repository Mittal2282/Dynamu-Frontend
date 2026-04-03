import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const authStore = create(
  devtools(
    persist(
      (set) => ({
        // Customer session token (from QR session start)
        sessionToken: null,
        setSessionToken: (sessionToken) => set(() => ({ sessionToken })),

        // Customer display name (entered at gate)
        guestName: null,
        setGuestName: (guestName) => set(() => ({ guestName })),

        // Admin tokens
        adminAccessToken: null,
        setAdminAccessToken: (adminAccessToken) => set(() => ({ adminAccessToken })),
        adminRefreshToken: null,
        setAdminRefreshToken: (adminRefreshToken) => set(() => ({ adminRefreshToken })),
        adminRole: null,
        setAdminRole: (adminRole) => set(() => ({ adminRole })),
        adminName: null,
        setAdminName: (adminName) => set(() => ({ adminName })),

        // Batch setter — used by LoginPage to set all admin fields at once
        setAdminTokens: ({ accessToken, refreshToken, role, name }) =>
          set(() => ({
            adminAccessToken:  accessToken,
            adminRefreshToken: refreshToken,
            adminRole:         role,
            adminName:         name,
          })),

        // Reset helpers
        resetAuth: () =>
          set(() => ({
            sessionToken: null,
            guestName: null,
            adminAccessToken: null,
            adminRefreshToken: null,
            adminRole: null,
            adminName: null,
          })),
      }),
      { name: 'AuthStore' }
    )
  )
);
