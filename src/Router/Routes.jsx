import React from 'react';
import { Route, Routes as RouterRoutes } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import MenuPage from '../consoles/menu';
import ChatPage from '../consoles/chat';
import CartPage from '../consoles/cart';
import AdminPage from '../consoles/admin';
import QRLandingPage from '../pages/QRLandingPage';

export default function Routes() {
  return (
    <RouterRoutes>
      {/* QR scan entry point — no app shell, works standalone on phone */}
      <Route path="/r/:slug/t/:qrCodeId" element={<QRLandingPage />} />

      <Route path="/" element={<MainLayout />}>
        <Route index element={<MenuPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </RouterRoutes>
  );
}
