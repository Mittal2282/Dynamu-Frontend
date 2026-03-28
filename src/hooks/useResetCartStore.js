import { cartStore } from '../store/cartStore';

/**
 * Returns a resetCart function that clears the cart in cartStore.
 */
export default function useResetCartStore() {
  const resetCart = () => cartStore.getState().clear();
  return resetCart;
}
