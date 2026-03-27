import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axiosInstance';

const QUICK_CHIPS = [
  { label: 'Spicy 🌶️',         text: 'Show me spicy dishes' },
  { label: "Chef's Special ⭐", text: "What's the chef's special here?" },
  { label: 'Under ₹300 💰',     text: 'Recommend something under ₹300' },
  { label: 'Veg 🥗',            text: 'Show me vegetarian options' },
  { label: 'Bestsellers 🔥',    text: 'What are your bestsellers?' },
  { label: 'Light meal 🍃',     text: 'Suggest something light' },
  { label: 'Budget ₹500 💸',    text: 'What can I get under ₹500?' },
];

function SpiceIndicator({ level }) {
  if (!level || level === 0) return null;
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map(i => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < level ? 'bg-red-400' : 'bg-white/10'}`} />
      ))}
    </span>
  );
}

/**
 * Single item recommendation card.
 * Uses the `cart` hook object from QRLandingPage's useCart() — items use `_id`.
 */
function ItemCard({ item, cart }) {
  const qty = cart.qty(item._id);

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
      {qty === 0 ? (
        <button
          onClick={() => cart.add(item)}
          className="px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-lg active:scale-95 transition-transform shrink-0"
        >
          + Add
        </button>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => cart.remove(item)}
            className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center active:scale-95 transition-transform"
          >
            −
          </button>
          <span className="text-xs font-bold w-4 text-center">{qty}</span>
          <button
            onClick={() => cart.add(item)}
            className="w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center active:scale-95 transition-transform"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * AIChatDrawer — self-contained bottom-sheet AI chat.
 * Lives inside QRLandingPage which is OUTSIDE AppProvider, so no context is used.
 *
 * Props:
 *   isOpen   {boolean}
 *   onClose  {() => void}
 *   cart     {object}  — the useCart() hook object from QRLandingPage
 */
export default function AIChatDrawer({ isOpen, onClose, cart }) {
  const [messages, setMessages]     = useState([]);
  const [inputText, setInputText]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [initialized, setInitialized] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Load history (or welcome message) exactly once — on first open
  useEffect(() => {
    if (!isOpen || initialized) return;
    setInitialized(true);

    api.get('/api/ai/chat/history')
      .then(res => {
        const history = res.data?.data;
        if (Array.isArray(history) && history.length > 0) {
          setMessages(history.map(m => ({
            role: m.role === 'user' ? 'user' : 'ai',
            text: m.content,
            items: [],
          })));
        } else {
          return api.get('/api/ai/chat/welcome');
        }
      })
      .then(res => {
        if (!res) return;
        const welcome = res.data?.data?.message;
        if (welcome) setMessages([{ role: 'ai', text: welcome, items: [] }]);
      })
      .catch(() => {
        setMessages([{
          role: 'ai',
          text: "Hi! I'm your AI menu assistant. What are you in the mood for today? 🍽️",
          items: [],
        }]);
      });
  }, [isOpen, initialized]);

  // Auto-scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  const sendMessage = useCallback(async (overrideText) => {
    const text = (overrideText ?? inputText).trim();
    if (!text) return;
    if (!overrideText) setInputText('');

    setMessages(prev => [...prev, { role: 'user', text, items: [] }]);
    setLoading(true);

    try {
      const res = await api.post('/api/ai/chat', { message: text });
      const { reply, recommended_items } = res.data.data;
      setMessages(prev => [...prev, {
        role: 'ai',
        text: reply,
        items: recommended_items || [],
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: "Sorry, I'm having trouble right now. Please try again in a moment.",
        items: [],
      }]);
    } finally {
      setLoading(false);
    }
  }, [inputText]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-full max-w-md bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl">

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                🤖 AI Menu Assistant
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Ask me about any dish or preference</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-3xl leading-none w-8 h-8 flex items-center justify-center"
            >
              &times;
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-none'
                      : 'bg-white/10 text-white rounded-tl-none border border-white/10'
                  }`}
                >
                  {m.text}
                </div>

                {/* Item recommendation cards */}
                {m.role === 'ai' && m.items?.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto mt-2 pb-1 max-w-full no-scrollbar">
                    {m.items.map(item => (
                      <ItemCard key={item._id} item={item} cart={cart} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-none border border-white/10">
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

          {/* Input area */}
          <div className="px-4 pb-6 pt-3 border-t border-white/10 shrink-0">
            {/* Quick suggestion chips */}
            <div className="flex gap-2 overflow-x-auto mb-3 pb-1 no-scrollbar">
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => sendMessage(chip.text)}
                  className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 whitespace-nowrap active:scale-95 transition-transform hover:bg-white/20"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Text input + send button */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                placeholder="Ask for suggestions..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 text-white"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className="bg-orange-500 p-3 rounded-2xl active:scale-95 transition-transform disabled:opacity-60"
              >
                🚀
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
