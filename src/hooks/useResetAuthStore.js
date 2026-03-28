import { authStore } from '../store/authStore';

/**
 * Returns a resetAuth function that clears all auth fields in authStore.
 */
export default function useResetAuthStore() {
  const resetAuth = () => authStore.getState().resetAuth();
  return resetAuth;
}
