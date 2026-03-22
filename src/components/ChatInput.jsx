import React, { useContext } from 'react';
import { AppContext } from '../store/AppContext';

export default function ChatInput() {
  const { userInput, setUserInput, handleSendChat } = useContext(AppContext);

  return (
    <div className="p-4 bg-slate-950 border-t border-white/10 absolute bottom-[80px] left-0 right-0 max-w-md mx-auto z-40">
      <div className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendChat();
          }}
          placeholder="Ask for suggestions..."
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-white"
        />
        <button
          onClick={handleSendChat}
          className="bg-primary p-3 rounded-2xl"
        >
          🚀
        </button>
      </div>
    </div>
  );
}
