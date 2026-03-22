import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../store/AppContext';

export default function Header() {
  const { cart } = useContext(AppContext);
  
  return (
    <header className="p-6 flex justify-between items-center bg-white/5 backdrop-blur-md border-b border-white/10">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Dynamu Smart Menu
        </h1>
        <p className="text-xs text-slate-400">Table 05 • Royal Cafe</p>
      </div>
      <Link to="/cart" className="relative cursor-pointer">
        <span className="text-2xl">🛒</span>
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {cart.reduce((a, b) => a + b.qty, 0)}
          </span>
        )}
      </Link>
    </header>
  );
}
