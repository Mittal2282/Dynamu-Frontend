import { BORDER, ORANGE } from '../../constants/landingConstants';
import { CHAT_MESSAGES } from '../../constants/landingContent';

export function ChatDemo() {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)] relative isolate"
      style={{
        background: 'rgba(12, 14, 21, 0.65)',
        border: `1px solid rgba(255,255,255,0.12)`,
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
      }}
    >
      <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      <div
        className="flex items-center justify-between px-5 py-4 border-b relative"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
            style={{ background: 'rgba(255,107,0,0.18)', color: ORANGE }}
          >
            Z
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-none">ZestyBot</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: ORANGE, opacity: 0.8 }}>
              Table 04 · AI Assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 relative">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
          </span>
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Online</span>
        </div>
      </div>

      <div className="px-5 py-5 space-y-3 min-h-[268px]">
        {CHAT_MESSAGES.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animation: 'revealUp 0.4s ease both', animationDelay: `${msg.delay}s`, opacity: 0 }}
          >
            <p
              className={`max-w-[82%] text-[12.5px] leading-relaxed px-4 py-2.5 rounded-2xl ${
                msg.from === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
              }`}
              style={
                msg.from === 'user'
                  ? { 
                      background: `linear-gradient(135deg, ${ORANGE} 0%, #FF9F45 100%)`, 
                      color: '#fff', 
                      boxShadow: '0 4px 16px rgba(255,107,0,0.25)' 
                    }
                  : { 
                      background: 'rgba(255,255,255,0.04)', 
                      border: `1px solid rgba(255,255,255,0.08)`, 
                      color: '#e2e8f0',
                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)'
                    }
              }
            >
              {msg.text}
            </p>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:bg-white/[0.05]"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <span className="flex-1 text-xs select-none" style={{ color: '#64748b' }}>
            Ask the menu anything…
          </span>
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0"
            style={{ background: ORANGE }}
          >
            ↑
          </div>
        </div>
      </div>
    </div>
  );
}
