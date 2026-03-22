import React, { useContext, useEffect } from 'react';
import { AppContext } from '../../store/AppContext';

export default function ChatPage() {
  const { chatMessages, loadingChat, chatEndRef } = useContext(AppContext);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatEndRef]);

  return (
    <div className="page-transition flex flex-col h-full">
      <div className="flex-1 space-y-4 mb-4">
        {chatMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl ${m.role === 'user'
              ? 'bg-primary rounded-tr-none'
              : 'bg-white/10 backdrop-blur-md rounded-tl-none border border-white/10'
              }`}>
              <p className="text-sm">{m.text}</p>
            </div>
          </div>
        ))}
        {loadingChat && (
          <div className="flex justify-start">
            <div className="bg-white/10 p-4 rounded-3xl rounded-tl-none animate-pulse text-xs">AI is typing...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
