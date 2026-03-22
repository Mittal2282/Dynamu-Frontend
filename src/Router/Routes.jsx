import React from 'react';
import { Route, Routes as RouterRoutes } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import MenuPage from '../consoles/menu';
import ChatPage from '../consoles/chat';
import CartPage from '../consoles/cart';
import AdminPage from '../consoles/admin';

export default function Routes() {
  return (
    <RouterRoutes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<MenuPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </RouterRoutes>
  );
}
