import React, { useContext } from 'react';
import { AppContext } from '../../store/AppContext';

export default function MenuPage() {
  const {
    MENU_CATEGORIES,
    selectedCategory,
    setSelectedCategory,
    filteredMenu,
    addToCart
  } = useContext(AppContext);

  return (
    <div className="page-transition space-y-6">
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {MENU_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="grid grid-cols-1 gap-4">
        {filteredMenu.map(item => (
          <div key={item.id} className="glass p-4 flex gap-4 items-center group">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shrink-0">
              {item.is_veg ? '🥗' : '🍗'}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-accent font-bold">₹{item.price}</p>
              </div>
              <p className="text-sm text-slate-400 line-clamp-2 mt-1">{item.description}</p>
              <button
                onClick={() => addToCart(item)}
                className="mt-3 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
              >
                + Quick Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
