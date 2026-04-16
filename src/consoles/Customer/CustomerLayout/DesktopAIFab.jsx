/**
 * DesktopAIFab — bottom-right floating action button to toggle AI chat drawer (desktop only).
 */
export default function DesktopAIFab({ aiChatOpen, onToggle }) {
  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-30">
      <button
        type="button"
        onClick={onToggle}
        className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-2xl"
        style={{
          background: aiChatOpen ? "var(--t-accent)" : "var(--t-surface)",
          border: "1.5px solid var(--t-accent2-40)",
          boxShadow: "0 8px 24px var(--t-accent2-40)",
        }}
        title={aiChatOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {aiChatOpen ? (
          "✕"
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--t-accent2)" }}
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        )}
      </button>
    </div>
  );
}
