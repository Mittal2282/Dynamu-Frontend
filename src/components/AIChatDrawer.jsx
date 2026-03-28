import { useCallback, useEffect, useRef } from 'react';
import { VegBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Drawer from '../components/ui/Drawer';
import { Spinner } from '../components/ui/Spinner';
import Text from '../components/ui/Text';
import { getChatHistory, getWelcomeMessage, sendChatMessage } from '../services/chatService';
import { cartStore } from '../store/cartStore';
import { chatStore } from '../store/chatStore';
import { restaurantStore } from '../store/restaurantStore';
import { QUICK_CHAT_CHIPS } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';

/* ─── Spice level dots ──────────────────────────────────────────────────────── */
function SpiceIndicator({ level }) {
  if (!level || level === 0) return null;
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < level ? 'bg-red-400' : 'bg-white/10'}`}
        />
      ))}
    </span>
  );
}

/* ─── Recommendation card ───────────────────────────────────────────────────── */
function ItemCard({ item }) {
  const { add, remove, getQty } = cartStore();
  const { currencySymbol } = restaurantStore();
  const q = getQty(item._id);

  return (
    <div className="bg-slate-800/80 border border-white/10 rounded-xl p-3 flex items-center gap-3 min-w-[210px] max-w-[250px] shrink-0">
      <VegBadge isVeg={item.is_veg} size="sm" />

      <div className="flex-1 min-w-0">
        <Text size="xs" weight="semibold" className="truncate leading-snug">{item.name}</Text>
        <div className="flex items-center gap-2 mt-0.5">
          <Text size="xs" weight="bold" color="brand">
            {formatCurrency(item.price, currencySymbol)}
          </Text>
          <SpiceIndicator level={item.spice_level} />
        </div>
      </div>

      {q === 0 ? (
        <Button size="sm" onClick={() => add(item)} className="shrink-0 text-xs px-2.5 py-1">
          + Add
        </Button>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => remove(item)} className="w-6 h-6 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center active:scale-95 transition-transform">−</button>
          <Text as="span" size="xs" weight="bold" className="w-4 text-center">{q}</Text>
          <button onClick={() => add(item)} className="w-6 h-6 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center active:scale-95 transition-transform">+</button>
        </div>
      )}
    </div>
  );
}

/* ─── AIChatDrawer ──────────────────────────────────────────────────────────── */
/**
 * Props: isOpen, onClose
 */
export default function AIChatDrawer({ isOpen, onClose }) {
  const { messages, loading, initialized, setMessages, addMessage, setLoading, setInitialized } = chatStore();
  const inputRef = useRef(null);
  const endRef   = useRef(null);

  // Load history once on first open
  useEffect(() => {
    if (!isOpen || initialized) return;
    setInitialized(true);

    getChatHistory()
      .then((history) => {
        if (Array.isArray(history) && history.length > 0) {
          setMessages(history.map(m => ({
            role:  m.role === 'user' ? 'user' : 'ai',
            text:  m.content,
            items: [],
          })));
        } else {
          return getWelcomeMessage();
        }
      })
      .then((welcome) => {
        if (typeof welcome === 'string' && welcome) {
          setMessages([{ role: 'ai', text: welcome, items: [] }]);
        }
      })
      .catch(() => {
        setMessages([{
          role: 'ai',
          text: "Hi! I'm your AI menu assistant. What are you in the mood for today? 🍽️",
          items: [],
        }]);
      });
  }, [isOpen, initialized]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  const send = useCallback(async (overrideText) => {
    const text = (overrideText ?? inputRef.current?.value ?? '').trim();
    if (!text) return;
    if (!overrideText && inputRef.current) inputRef.current.value = '';

    addMessage({ role: 'user', text, items: [] });
    setLoading(true);

    try {
      const { reply, recommended_items } = await sendChatMessage(text);
      addMessage({ role: 'ai', text: reply, items: recommended_items || [] });
    } catch {
      addMessage({
        role:  'ai',
        text:  "Sorry, I'm having trouble right now. Please try again in a moment.",
        items: [],
      });
    } finally {
      setLoading(false);
    }
  }, [addMessage, setLoading]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} maxHeight="85vh">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
        <div>
          <Text as="h2" size="lg" weight="bold">🤖 AI Menu Assistant</Text>
          <Text size="xs" color="muted" className="mt-0.5">Ask me about any dish or preference</Text>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-3xl leading-none w-8 h-8 flex items-center justify-center transition-colors"
          aria-label="Close chat"
        >
          &times;
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={[
              'max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
              m.role === 'user'
                ? 'bg-brand text-white rounded-tr-none'
                : 'bg-white/10 text-white rounded-tl-none border border-white/10',
            ].join(' ')}>
              {m.text}
            </div>

            {m.role === 'ai' && m.items?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mt-2 pb-1 max-w-full no-scrollbar">
                {m.items.map(item => <ItemCard key={item._id} item={item} />)}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-none border border-white/10">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(delay => (
                  <span key={delay} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-6 pt-3 border-t border-white/10 shrink-0">
        {/* Quick chips */}
        <div className="flex gap-2 overflow-x-auto mb-3 pb-1 no-scrollbar">
          {QUICK_CHAT_CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => send(chip.text)}
              className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 whitespace-nowrap active:scale-95 transition-transform hover:bg-white/20"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Text input + send */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            defaultValue=""
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="Ask for suggestions…"
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-brand text-white transition-colors"
          />
          <Button onClick={() => send()} disabled={loading} className="px-3">
            {loading ? <Spinner size="sm" /> : '🚀'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
