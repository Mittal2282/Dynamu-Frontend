import { useRef, useCallback } from 'react';
import { sendChatMessage } from '../services/chatService';
import { chatStore } from '../store/chatStore';
import { Spinner } from '../components/ui/Spinner';
import { QUICK_CHAT_CHIPS } from '../utils/constants';

export default function ChatInput() {
  const { loading, addMessage, setLoading } = chatStore();
  const inputRef = useRef(null);

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
        role: 'ai',
        text: "I'm having trouble connecting. Please try again in a moment.",
        items: [],
      });
    } finally {
      setLoading(false);
    }
  }, [addMessage, setLoading]);

  return (
    <div className="p-4 bg-slate-950 border-t border-white/10 absolute bottom-[80px] left-0 right-0 max-w-md mx-auto z-40">
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

      {/* Input + send */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          defaultValue=""
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder="Ask for suggestions…"
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-brand text-white transition-colors"
        />
        <button
          onClick={() => send()}
          disabled={loading}
          className="bg-brand p-3 rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
          aria-label="Send"
        >
          {loading ? <Spinner size="sm" /> : '🚀'}
        </button>
      </div>
    </div>
  );
}
