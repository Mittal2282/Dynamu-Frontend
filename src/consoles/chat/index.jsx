import React, { useRef, useEffect } from 'react';
import { cartStore } from '../../store/cartStore';
import { chatStore } from '../../store/chatStore';

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
  const { add, remove, qty } = cartStore();
  const q = qty(item._id);

  return (
    <div className="bg-slate-800/80 border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-[210px] max-w-[250px] shrink-0">
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
      {q === 0 ? (
        <button
          onClick={() => add(item)}
          className="px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-lg active:scale-95 transition-transform shrink-0"
        >
          + Add
        </button>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => remove(item)}
            className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center active:scale-95 transition-transform"
          >
            −
          </button>
          <span className="text-xs font-bold w-4 text-center">{q}</span>
          <button
            onClick={() => add(item)}
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
  const { messages, loading } = chatStore();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="page-transition flex flex-col h-full">
      <div className="flex-1 space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[80%] p-4 rounded-3xl ${
                m.role === 'user'
                  ? 'bg-primary rounded-tr-none'
                  : 'bg-white/10 backdrop-blur-md rounded-tl-none border border-white/10'
              }`}
            >
              <p className="text-sm">{m.text}</p>
            </div>
            {m.role === 'ai' && m.items && m.items.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mt-2 pb-1 max-w-full no-scrollbar">
                {m.items.map(item => (
                  <RecommendedItemCard key={item._id} item={item} />
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
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

        <div ref={endRef} />
      </div>
    </div>
  );
}
