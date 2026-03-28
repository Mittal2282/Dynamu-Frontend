import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cartStore } from '../../store/cartStore';
import { apiCaller } from '../../api/apiCaller';

export default function CartPage() {
  const { items, total, clear } = cartStore();
  const navigate = useNavigate();

  const handleOrder = async () => {
    if (items.length === 0) {
      alert('Cart is empty');
      return;
    }
    try {
      await apiCaller({
        method: 'POST',
        endpoint: '/api/order',
        payload: { items, total_price: total },
      });
      clear();
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to place order.');
    }
  };

  return (
    <div className="page-transition space-y-6">
      <h2 className="text-xl font-bold">Your Order</h2>
      {items.length === 0 ? (
        <p className="text-slate-400">Your cart is empty. Talk to AI for suggestions!</p>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item._id} className="flex justify-between items-center glass p-4">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-xs text-slate-400">₹{item.price} x {item.qty}</p>
              </div>
              <div className="font-bold">₹{item.price * item.qty}</div>
            </div>
          ))}
          <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xl font-bold">
            <span>Grand Total</span>
            <span className="text-accent">₹{total}</span>
          </div>
          <button
            onClick={handleOrder}
            className="w-full py-4 bg-gradient-to-r from-primary to-secondary rounded-2xl font-bold shadow-xl shadow-primary/20 transform active:scale-95 transition-transform"
          >
            Place Order Now
          </button>
        </div>
      )}
    </div>
  );
}
