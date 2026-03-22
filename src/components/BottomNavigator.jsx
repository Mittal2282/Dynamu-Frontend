import React from 'react';
import { NavLink } from 'react-router-dom';

export default function BottomNavigator() {
  return (
    <nav className="fixed bottom-4 left-4 right-4 max-w-[400px] mx-auto h-16 glass flex justify-around items-center p-2 z-50">
      <NavLink
        to="/"
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-white scale-110' : 'text-slate-400'}`}
      >
        <span className="text-xl">📖</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Menu</span>
      </NavLink>
      <NavLink
        to="/chat"
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-white scale-110' : 'text-slate-400'}`}
      >
        <div className="relative">
          <span className="text-xl">🤖</span>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">AI Hub</span>
      </NavLink>
      <NavLink
        to="/cart"
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-white scale-110' : 'text-slate-400'}`}
      >
        <span className="text-xl">🛍️</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Cart</span>
      </NavLink>
      <NavLink
        to="/admin"
        className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-white scale-110' : 'text-slate-400'}`}
      >
        <span className="text-xl">👩‍🍳</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Admin</span>
      </NavLink>
    </nav>
  );
}
