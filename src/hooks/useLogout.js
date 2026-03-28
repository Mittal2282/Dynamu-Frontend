import { useNavigate } from 'react-router-dom';
import { apiCaller } from '../api/apiCaller';
import { authStore } from '../store/authStore';
import useResetAuthStore from './useResetAuthStore';
import useResetCartStore from './useResetCartStore';

/**
 * Hook that provides a logout() function.
 * Calls POST /api/auth/logout, then clears auth + cart stores and navigates to /login.
 */
export default function useLogout() {
  const navigate = useNavigate();
  const resetAuth = useResetAuthStore();
  const resetCart = useResetCartStore();

  const logout = async () => {
    try {
      const { adminRefreshToken } = authStore.getState();
      await apiCaller({
        method: 'POST',
        endpoint: '/api/auth/logout',
        payload: { refresh_token: adminRefreshToken },
        useAdmin: true,
      });
    } catch {
      // Best-effort — always clear local state regardless
    } finally {
      resetAuth();
      resetCart();
      navigate('/login', { replace: true });
    }
  };

  return logout;
}
