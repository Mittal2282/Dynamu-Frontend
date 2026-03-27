import React, { useContext } from 'react';
import { AppContext } from '../store/AppContext';

const QUICK_CHIPS = [
  { label: 'Spicy 🌶️',         text: 'Show me spicy dishes' },
  { label: "Chef's Special ⭐", text: "What's the chef's special here?" },
  { label: 'Under ₹300 💰',     text: 'Recommend something under ₹300' },
  { label: 'Veg 🥗',            text: 'Show me vegetarian options' },
  { label: 'Bestsellers 🔥',    text: 'What are your bestsellers?' },
  { label: 'Light meal 🍃',     text: 'Suggest something light' },
  { label: 'Budget ₹500 💸',    text: 'What can I get under ₹500?' },
];

export default function ChatInput() {
  const { userInput, setUserInput, handleSendChat } = useContext(AppContext);

  return (
    <div className="p-4 bg-slate-950 border-t border-white/10 absolute bottom-[80px] left-0 right-0 max-w-md mx-auto z-40">
      {/* Quick suggestion chips */}
      <div className="flex gap-2 overflow-x-auto mb-3 pb-1 no-scrollbar">
        {QUICK_CHIPS.map(chip => (
          <button
            key={chip.label}
            onClick={() => handleSendChat(chip.text)}
            className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 whitespace-nowrap active:scale-95 transition-transform hover:bg-white/20"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Text input + send */}
      <div className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
          placeholder="Ask for suggestions..."
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white"
        />
        <button
          onClick={() => handleSendChat()}
          className="bg-primary p-3 rounded-2xl active:scale-95 transition-transform"
        >
          🚀
        </button>
      </div>
    </div>
  );
}
