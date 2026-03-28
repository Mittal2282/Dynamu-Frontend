import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import BottomNavigator from '../components/BottomNavigator';
import ChatInput from '../components/ChatInput';
import CartDrawer from '../components/CartDrawer';
import { cartStore, useCartItems, useCartCount, useCartTotal } from '../store/cartStore';
import { restaurantStore } from '../store/restaurantStore';
import { placeOrder } from '../services/customerService';
import { useToast } from '../components/ui/Toast';

export default function MainLayout() {
  const location       = useLocation();
  const isChat         = location.pathname === '/chat';
  const toast          = useToast();

  const { add, remove, clear } = cartStore();
  const items = useCartItems();
  const total = useCartTotal();
  const count = useCartCount();
  const { tableName, tableNumber, name: restaurantName } = restaurantStore();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [ordering, setOrdering]     = useState(false);

  const handlePlaceOrder = async () => {
    if (ordering || items.length === 0) return;
    setOrdering(true);
    try {
      await placeOrder({ tableNumber, items, totalPrice: total });
      clear();
      setIsCartOpen(false);
      toast({ status: 'success', title: 'Order placed!', description: 'The kitchen has your order 👨‍🍳' });
    } catch {
      toast({ status: 'error', title: 'Order failed', description: 'Please try again or ask staff for help.' });
    } finally {
      setOrdering(false);
    }
  };

  const subtitle = restaurantName
    ? `${restaurantName}${tableName ? ` · ${tableName}` : ''}`
    : 'Table 05 · Royal Cafe';

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-slate-950 text-white font-sans overflow-hidden relative">
      <Header onCartClick={() => setIsCartOpen(true)} />

      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        <Outlet />
      </main>

      {isChat && <ChatInput />}
      <BottomNavigator />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onAdd={add}
        onRemove={remove}
        onPlaceOrder={handlePlaceOrder}
        total={total}
        count={count}
        loading={ordering}
        subtitle={subtitle}
      />
    </div>
  );
}
