import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function BottomNavigator({ activeTab, onMenuClick, onChatClick, onCartClick }) {
  const location = useLocation();

  const isTabActive = (path, name) => {
    if (activeTab) return activeTab === name;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ to, name, icon, label, hasPing }) => {
    const active = isTabActive(to, name);
    const className = `flex flex-col items-center gap-1 transition-all ${active ? 'text-white scale-110' : 'text-slate-400'}`;
    const onClick = name === 'menu' ? onMenuClick 
                  : name === 'chat' ? onChatClick 
                  : name === 'cart' ? onCartClick 
                  : null;

    const content = (
      <>
        {hasPing ? (
          <div className="relative">
            <span className="text-xl">{icon}</span>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          </div>
        ) : (
          <span className="text-xl">{icon}</span>
        )}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </>
    );

    if (onClick) {
      return (
        <button onClick={onClick} className={className}>
          {content}
        </button>
      );
    }

    return (
      <NavLink to={to} className={className}>
        {content}
      </NavLink>
    );
  };

  return (
    <nav className="fixed bottom-4 left-4 right-4 max-w-[400px] mx-auto h-16 glass flex justify-around items-center p-2 z-50">
      <NavItem to="/" name="menu" icon="📖" label="Menu" />
      <NavItem to="/chat" name="chat" icon="🤖" label="AI Hub" hasPing />
      <NavItem to="/cart" name="cart" icon="🛍️" label="Cart" />
      <NavItem to="/admin" name="admin" icon="👩‍🍳" label="Admin" />
    </nav>
  );
}
