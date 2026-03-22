import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import BottomNavigator from '../components/BottomNavigator';
import ChatInput from '../components/ChatInput';

export default function MainLayout() {
  const location = useLocation();
  const isChat = location.pathname === '/chat';

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-slate-950 text-white font-sans overflow-hidden relative">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        <Outlet />
      </main>
      {isChat && <ChatInput />}
      <BottomNavigator />
    </div>
  );
}
