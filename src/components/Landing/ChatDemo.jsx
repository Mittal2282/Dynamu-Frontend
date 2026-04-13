import { BORDER, ORANGE } from '../../constants/landingConstants';
import { CHAT_MESSAGES } from '../../constants/landingContent';

export function ChatDemo() {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: '#0C0E15',
        border: `1px solid ${BORDER}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: BORDER, background: 'rgba(255,107,0,0.05)' }}
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
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-400">Active</span>
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
                  ? { background: ORANGE, color: '#fff' }
                  : { background: 'rgba(255,255,255,0.07)', border: `1px solid ${BORDER}`, color: '#cbd5e1' }
              }
            >
              {msg.text}
            </p>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: BORDER }}
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
