import { useCallback, useEffect, useRef, useState } from "react";
import { VegBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Drawer from "../components/ui/Drawer";
import LazyImage from "../components/ui/LazyImage";
import { Spinner } from "../components/ui/Spinner";
import Text from "../components/ui/Text";
import {
  getChatHistory,
  getWelcomeMessage,
  sendChatMessage,
} from "../services/chatService";
import { cartStore } from "../store/cartStore";
import { chatStore } from "../store/chatStore";
import { restaurantStore } from "../store/restaurantStore";
import { QUICK_CHAT_CHIPS } from "../utils/constants";
import { formatCurrency } from "../utils/formatters";

const WELCOME_FALLBACK =
  "Welcome! I'm here to help you discover delicious food. What are you in the mood for today?";

const SpeechRecognitionAvailable = !!(
  window.SpeechRecognition || window.webkitSpeechRecognition
);

const INFRA_FOOTER = "SECURE AI INFRASTRUCTURE v2.4.0";

function parseChatTimestamp(m) {
  const raw = m.created_at ?? m.createdAt ?? m.timestamp ?? m.time;
  if (raw == null) return undefined;
  const t = typeof raw === "number" ? raw : new Date(raw).getTime();
  return Number.isFinite(t) ? t : undefined;
}

function formatMessageTime(ts) {
  if (ts == null) return null;
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ─── Spice level dots ──────────────────────────────────────────────────────── */
function SpiceIndicator({ level }) {
  if (!level || level === 0) return null;
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < level ? "bg-red-400" : "bg-white/10"}`}
        />
      ))}
    </span>
  );
}

/* ─── Same stepper pattern as CartDrawer ────────────────────────────────────── */
function Stepper({ qty, onAdd, onRemove }) {
  return (
    <div
      className="flex items-center gap-0 rounded-xl overflow-hidden shrink-0"
      style={{ border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <button
        type="button"
        onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 text-lg font-bold transition-colors active:scale-90 cursor-pointer"
        aria-label="Remove one"
      >
        −
      </button>
      <Text
        as="span"
        size="sm"
        weight="bold"
        color="white"
        className="w-8 text-center select-none"
        style={{ lineHeight: "2rem" }}
      >
        {String(qty).padStart(2, "0")}
      </Text>
      <button
        type="button"
        onClick={onAdd}
        className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 text-lg font-bold transition-colors active:scale-90 cursor-pointer"
        aria-label="Add one"
      >
        +
      </button>
    </div>
  );
}

/* ─── Full-width recommendation row (CartItem-style, no instructions) ─────── */
function RecommendationRow({ item }) {
  const { add, remove, getQty } = cartStore();
  const { currencySymbol } = restaurantStore();
  const id = item._id ?? item.id;
  const q = getQty(id);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-start gap-3">
        <VegBadge isVeg={item.is_veg} className="mt-0.5 shrink-0" />

        <LazyImage
          src={item.image_url}
          alt={item.name}
          containerClassName="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center"
          placeholder={
            <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-slate-400 px-1 text-center">
                No image available
              </span>
            </div>
          }
        />

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <Text
            as="p"
            size="sm"
            weight="semibold"
            color="white"
            className="leading-snug"
          >
            {item.name}
          </Text>
          {item.description && (
            <Text
              as="p"
              size="xs"
              color="white"
              className="opacity-40 mt-0.5 line-clamp-1"
            >
              {item.description}
            </Text>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Text as="p" size="sm" weight="bold" color="brand">
              {formatCurrency(item.price, currencySymbol)}
            </Text>
            <SpiceIndicator level={item.spice_level} />
          </div>
        </div>

        {q === 0 ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => add(item)}
            className="shrink-0 !uppercase !tracking-wide !text-[10px] !px-3 !py-2 !rounded-xl"
          >
            ＋ ADD TO CART
          </Button>
        ) : (
          <Stepper
            qty={q}
            onAdd={() => add(item)}
            onRemove={() => remove(item)}
          />
        )}
      </div>
    </div>
  );
}

function BookIcon({ className }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2H20V20H6.5C5.83696 20 5.20107 19.7366 4.73223 19.2678C4.26339 18.7989 4 18.163 4 17.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 7H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 11H13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

/** Renders plain text with **segments** as bold brand-colored spans */
function RichChatText({ text, className }) {
  if (!text) return null;
  const parts = String(text).split(/\*\*/);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-bold text-[var(--t-accent)]">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

function WelcomeScreen({ welcomeParagraph, onSuggest }) {
  return (
    <div className="flex flex-col items-stretch px-1 pt-2 pb-4">
      <div
        className="self-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/95 mb-6 ai-chat-badge-pulse"
        style={{
          background: "var(--t-accent2-20)",
          border: "1px solid var(--t-accent2-40)",
          color: "var(--t-accent2)",
        }}
      >
        ✨ INTELLIGENCE ACTIVE
      </div>

      <h2
        className="text-2xl sm:text-[1.65rem] font-bold text-white leading-tight text-center ai-chat-fade-in-up"
        style={{ animationDelay: "60ms" }}
      >
        Hello! I&apos;m your{" "}
        <span className="ai-chat-gradient-text">AI Sommelier.</span>
      </h2>

      <Text
        as="p"
        size="sm"
        color="muted"
        className="text-center mt-4 px-2 leading-relaxed opacity-80 ai-chat-fade-in-up"
        style={{ animationDelay: "120ms" }}
      >
        {welcomeParagraph || WELCOME_FALLBACK}
      </Text>

      <Text
        as="p"
        size="xs"
        className="mt-10 mb-3 text-white/35 uppercase tracking-widest font-bold text-center ai-chat-fade-in-up"
        style={{ animationDelay: "180ms" }}
      >
        TRY THESE SUGGESTIONS
      </Text>

      <div className="flex flex-col gap-2.5">
        {QUICK_CHAT_CHIPS.map((chip, i) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => onSuggest(chip.text)}
            className="w-full text-left px-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white/90 hover:bg-white/10 hover:border-white/15 active:scale-[0.99] transition-all ai-chat-fade-in-up"
            style={{ animationDelay: `${220 + i * 50}ms` }}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatHeader({ onClose }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-[var(--t-accent)] shrink-0">
          <BookIcon />
        </span>
        <Text
          as="h2"
          size="md"
          weight="bold"
          color="white"
          className="truncate uppercase tracking-wide"
        >
          AI Menu Assistant
        </Text>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors text-lg shrink-0 cursor-pointer active:scale-95"
        aria-label="Close chat"
      >
        ✕
      </button>
    </div>
  );
}

/* ─── AIChatDrawer ──────────────────────────────────────────────────────────── */
/**
 * Props: isOpen, onClose
 */
export default function AIChatDrawer({ isOpen, onClose }) {
  const {
    messages,
    loading,
    initialized,
    setMessages,
    addMessage,
    setLoading,
    setInitialized,
  } = chatStore();
  const [welcomeText, setWelcomeText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const recognitionRef = useRef(null);

  const hasUserMessage = messages.some((m) => m.role === "user");
  const showWelcomeLayout = messages.length === 0 && !loading;

  useEffect(() => {
    if (!isOpen || initialized) return;
    setInitialized(true);

    getChatHistory()
      .then((history) => {
        if (Array.isArray(history) && history.length > 0) {
          setMessages(
            history.map((m) => ({
              role: m.role === "user" ? "user" : "ai",
              text: m.content,
              items: Array.isArray(m.recommended_items)
                ? m.recommended_items
                : [],
              timestamp: parseChatTimestamp(m),
            })),
          );
          return undefined;
        }
        setMessages([]);
        return getWelcomeMessage();
      })
      .then((welcome) => {
        if (typeof welcome === "string" && welcome.trim()) {
          setWelcomeText(welcome.trim());
        }
      })
      .catch(() => {
        setMessages([]);
        setWelcomeText(
          "Hi! I'm your AI menu assistant. What are you in the mood for today? 🍽️",
        );
      });
  }, [isOpen, initialized, setInitialized, setMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showWelcomeLayout]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setInputText(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        // Use functional state or a ref if send needs to be stable
        // But since we are calling it now, we can just pass the transcript
        send(transcript);
      }
    };
    recognition.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const send = useCallback(
    async (overrideText) => {
      const text = (overrideText ?? inputText ?? "").trim();
      if (!text) return;
      if (text.length > 500) {
        addMessage({
          role: "ai",
          text: "Your message is a bit long — try a shorter question! 😊",
          items: [],
          timestamp: Date.now(),
        });
        return;
      }
      setInputText("");

      addMessage({ role: "user", text, items: [], timestamp: Date.now() });
      setLoading(true);

      try {
        const { reply, recommended_items } = await sendChatMessage(text);
        addMessage({
          role: "ai",
          text: reply,
          items: recommended_items || [],
          timestamp: Date.now(),
        });
      } catch {
        addMessage({
          role: "ai",
          text: "Sorry, I'm having trouble right now. Please try again in a moment.",
          items: [],
          timestamp: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setLoading, inputText],
  );

  const inputPlaceholder = hasUserMessage
    ? "Ask follow-up…"
    : "Ask for suggestions…";

  /* ── Shared chat body ─────────────────────────────────────────────────── */
  const chatBody = (
    <>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 min-h-0">
        {showWelcomeLayout ? (
          <WelcomeScreen welcomeParagraph={welcomeText} onSuggest={send} />
        ) : (
          <div className="space-y-5">
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              const t = formatMessageTime(m.timestamp);

              return (
                <div
                  key={i}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  {!isUser && (
                    <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-sm shrink-0"
                        style={{
                          background: "var(--t-accent2)",
                          boxShadow: "0 0 6px var(--t-accent2-40)",
                        }}
                      />
                      <Text
                        as="span"
                        size="xs"
                        weight="bold"
                        className="uppercase tracking-widest"
                        style={{ color: "var(--t-accent2)" }}
                      >
                        INTELLIGENCE AGENT
                      </Text>
                    </div>
                  )}

                  <div
                    className={[
                      "max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      isUser
                        ? "bg-brand text-white rounded-tr-sm"
                        : "bg-white/5 text-white/95 rounded-tl-sm border border-white/10 border-l-4",
                    ].join(" ")}
                    style={
                      !isUser
                        ? { borderLeftColor: "var(--t-accent2)" }
                        : undefined
                    }
                  >
                    {isUser ? (
                      m.text
                    ) : (
                      <RichChatText
                        text={m.text}
                        className="whitespace-pre-wrap break-words"
                      />
                    )}
                  </div>

                  {t && (
                    <Text
                      as="span"
                      size="xs"
                      className="mt-1.5 px-1 uppercase tracking-wide text-white/35"
                    >
                      {isUser ? "YOU" : "ASSISTANT"} · {t}
                    </Text>
                  )}

                  {!isUser && m.items?.length > 0 && (
                    <div className="mt-3 w-full max-w-full space-y-2.5 pl-0">
                      {m.items.map((item) => (
                        <RecommendationRow
                          key={item._id ?? item.id}
                          item={item}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-sm shrink-0"
                    style={{
                      background: "var(--t-accent2)",
                      boxShadow: "0 0 6px var(--t-accent2-40)",
                    }}
                  />
                  <Text
                    as="span"
                    size="xs"
                    weight="bold"
                    className="uppercase tracking-widest"
                    style={{ color: "var(--t-accent2)" }}
                  >
                    INTELLIGENCE AGENT
                  </Text>
                </div>
                <div
                  className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm border border-white/10 border-l-4"
                  style={{ borderLeftColor: "var(--t-accent2)" }}
                >
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="px-4 pt-3 pb-5 border-t border-white/10 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder={inputPlaceholder}
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--t-accent)] text-white transition-colors placeholder:text-white/35 disabled:opacity-60"
          />
          {SpeechRecognitionAvailable && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              className={`w-[52px] h-[52px] shrink-0 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer text-xl ${
                isListening
                  ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              }`}
              title={isListening ? "Stop listening" : "Speak your order"}
            >
              🎙️
            </button>
          )}
          <button
            type="button"
            onClick={() => send()}
            disabled={loading}
            className="w-[52px] h-[52px] shrink-0 rounded-2xl flex items-center justify-center text-black transition-transform active:scale-[0.97] disabled:opacity-50 cursor-pointer"
            style={{ background: "var(--t-accent)" }}
            aria-label="Send"
          >
            {loading ? (
              <Spinner size="sm" className="!border-black/35 !border-t-black" />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto mt-3 pb-0.5 no-scrollbar">
          {QUICK_CHAT_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => send(chip.text)}
              disabled={loading}
              className="px-3 py-1.5 bg-transparent border border-white/15 rounded-full text-xs text-white/85 whitespace-nowrap active:scale-95 transition-transform hover:border-white/25 hover:bg-white/5 disabled:opacity-50 shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <Text
          as="p"
          size="xs"
          className="text-center mt-3 text-white/25 uppercase tracking-widest"
        >
          {INFRA_FOOTER}
        </Text>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile: full-height bottom-sheet drawer ────────────────────────── */}
      <Drawer isOpen={isOpen} onClose={onClose} height="85vh" mobileOnly>
        <ChatHeader onClose={onClose} />
        {chatBody}
      </Drawer>

      {/* ── Desktop: floating panel anchored to bottom-right ──────────────── */}
      <div
        className={[
          "hidden md:flex fixed bottom-6 right-6 z-50 flex-col overflow-hidden shadow-2xl",
          "transition-all duration-300 origin-bottom-right",
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-90 pointer-events-none",
        ].join(" ")}
        style={{
          width: "420px",
          height: "560px",
          background: "var(--t-bg)",
          borderRadius: "20px",
          border: "1.5px solid var(--t-accent)",
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px var(--t-accent-20)",
        }}
      >
        <ChatHeader onClose={onClose} />
        {chatBody}
      </div>
    </>
  );
}
