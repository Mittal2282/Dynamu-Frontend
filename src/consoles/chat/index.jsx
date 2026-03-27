import React, { useContext, useEffect } from 'react';
import { AppContext } from '../../store/AppContext';

function SpiceIndicator({ level }) {
  if (!level || level === 0) return null;
  return (
    <span className="flex items-center gap-0.5" title={['', 'Mild', 'Medium', 'Very Spicy'][level]}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < level ? 'bg-red-400' : 'bg-white/10'}`}
        />
      ))}
    </span>
  );
}

function RecommendedItemCard({ item }) {
  const { addToCart, removeFromCart, cart } = useContext(AppContext);

  // AppContext cart uses `id` key; recommended items from API have `_id`
  const cartItem = { id: item._id, name: item.name, price: item.price, is_veg: item.is_veg };
  const inCart   = cart.find(c => c.id === item._id);
  const qty      = inCart?.qty ?? 0;

  return (
    <div className="bg-slate-800/80 border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-[210px] max-w-[250px] shrink-0">
      {/* Veg / non-veg dot */}
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
        style={{ backgroundColor: item.is_veg ? '#22c55e' : '#ef4444' }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-snug truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-orange-400 text-xs font-bold">₹{item.price}</span>
          <SpiceIndicator level={item.spice_level} />
        </div>
      </div>

      {/* Cart control */}
      {qty === 0 ? (
        <button
          onClick={() => addToCart(cartItem)}
          className="px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-lg active:scale-95 transition-transform shrink-0"
        >
          + Add
        </button>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => removeFromCart(cartItem)}
            className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center active:scale-95 transition-transform"
          >
            −
          </button>
          <span className="text-xs font-bold w-4 text-center">{qty}</span>
          <button
            onClick={() => addToCart(cartItem)}
            className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center active:scale-95 transition-transform"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const { chatMessages, loadingChat, chatEndRef } = useContext(AppContext);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatEndRef]);

  return (
    <div className="page-transition flex flex-col h-full">
      <div className="flex-1 space-y-4 mb-4">
        {chatMessages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            {/* Message bubble */}
            <div
              className={`max-w-[80%] p-4 rounded-3xl ${
                m.role === 'user'
                  ? 'bg-primary rounded-tr-none'
                  : 'bg-white/10 backdrop-blur-md rounded-tl-none border border-white/10'
              }`}
            >
              <p className="text-sm">{m.text}</p>
            </div>

            {/* Horizontally scrollable recommended item cards */}
            {m.role === 'ai' && m.items && m.items.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mt-2 pb-1 max-w-full no-scrollbar">
                {m.items.map(item => (
                  <RecommendedItemCard key={item._id} item={item} />
                ))}
              </div>
            )}
          </div>
        ))}

        {loadingChat && (
          <div className="flex justify-start">
            <div className="bg-white/10 p-4 rounded-3xl rounded-tl-none border border-white/10">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
