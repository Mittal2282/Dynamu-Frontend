import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  getChatHistory,
  getWelcomeMessage,
  streamChatMessage,
} from "../../services/chatService";
import { useCartCount } from "../../store/cartStore";
import { chatStore } from "../../store/chatStore";
import { restaurantStore } from "../../store/restaurantStore";
import { QUICK_CHAT_CHIPS } from "../../utils/constants";
import MenuItemCard from "../customer/MenuItemCard";
import Drawer from "../ui/Drawer";
import { Spinner } from "../ui/Spinner";
import Text from "../ui/Text";

const WELCOME_FALLBACK =
  "Welcome! I'm here to help you discover delicious food. What are you in the mood for today?";

const SpeechRecognitionAvailable = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

const INFRA_FOOTER = "SECURE AI INFRASTRUCTURE v1.4.0";

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  items?: unknown[];
  timestamp?: number;
  streaming?: boolean;
  mode?: string;
  options?: string[];
}

function parseChatTimestamp(m: Record<string, unknown>): number | undefined {
  const raw = m.created_at ?? m.createdAt ?? m.timestamp ?? m.time;
  if (raw == null) return undefined;
  const t = typeof raw === "number" ? raw : new Date(raw as string).getTime();
  return Number.isFinite(t) ? (t as number) : undefined;
}

function formatMessageTime(ts: number | undefined | null): string | null {
  if (ts == null) return null;
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface BotIconProps {
  className?: string;
}

function BotIcon({ className }: BotIconProps) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

/** Renders inline markdown: **bold** → brand-colored bold */
function renderInline(text: string, keyPrefix = ""): React.ReactNode[] {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={`${keyPrefix}b${i}`} className="font-bold text-(--t-accent)">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

/** Renders a full AI response with markdown: ###/## headings, - lists, **bold** */
function MarkdownMessage({ text }: { text: string }) {
  if (!text) return null;
  const lines = String(text).split("\n");
  const result: React.ReactNode[] = [];
  let pendingListItems: string[] = [];

  function flushList(key: string) {
    if (pendingListItems.length === 0) return;
    result.push(
      <ul key={key} className="mt-1.5 mb-1 space-y-1.5">
        {pendingListItems.map((item, i) => (
          <li key={i} className="flex gap-2 items-start">
            <span
              className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--t-accent2)", opacity: 0.7 }}
            />
            <span>{renderInline(item, `li${i}`)}</span>
          </li>
        ))}
      </ul>,
    );
    pendingListItems = [];
  }

  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("### ")) {
      flushList(`fl-${i}`);
      result.push(
        <p key={i} className="font-bold text-sm mt-2.5 mb-1 first:mt-0" style={{ color: "var(--t-text)" }}>
          {renderInline(t.slice(4), `h3-${i}`)}
        </p>,
      );
    } else if (t.startsWith("## ")) {
      flushList(`fl-${i}`);
      result.push(
        <p key={i} className="font-semibold text-[15px] mt-2.5 mb-1 first:mt-0" style={{ color: "var(--t-text)" }}>
          {renderInline(t.slice(3), `h2-${i}`)}
        </p>,
      );
    } else if (t.startsWith("- ") || t.startsWith("* ")) {
      pendingListItems.push(t.slice(2));
    } else if (t === "") {
      flushList(`fl-${i}`);
    } else {
      flushList(`fl-${i}`);
      result.push(
        <p key={i} className="leading-relaxed">
          {renderInline(t, `p-${i}`)}
        </p>,
      );
    }
  });

  flushList("final");

  return <>{result}</>;
}

interface WelcomeScreenProps {
  welcomeParagraph: string;
  onSuggest: (text: string) => void;
}

function WelcomeScreen({ welcomeParagraph, onSuggest }: WelcomeScreenProps) {
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
        className="text-2xl sm:text-[1.65rem] font-bold leading-tight text-center ai-chat-fade-in-up"
        style={{ animationDelay: "60ms", color: "var(--t-text)" }}
      >
        Hello! I&apos;m your <span className="ai-chat-gradient-text">AI Sommelier.</span>
      </h2>

      <p
        className="text-sm text-center mt-4 px-2 leading-relaxed opacity-80 ai-chat-fade-in-up"
        style={{ animationDelay: "120ms", color: "var(--t-dim)" }}
      >
        {welcomeParagraph || WELCOME_FALLBACK}
      </p>

      <p
        className="mt-10 mb-3 text-[10px] uppercase tracking-widest font-bold text-center ai-chat-fade-in-up"
        style={{ animationDelay: "180ms", color: "var(--t-dim)", opacity: 0.6 }}
      >
        TRY THESE SUGGESTIONS
      </p>

      <div className="flex flex-col gap-2.5">
        {QUICK_CHAT_CHIPS.map((chip, i) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => onSuggest(chip.text)}
            className="w-full text-left px-4 py-3.5 rounded-xl text-sm active:scale-[0.99] transition-all ai-chat-fade-in-up"
            style={{
              animationDelay: `${220 + i * 50}ms`,
              background: "var(--t-float)",
              border: "1px solid var(--t-line)",
              color: "var(--t-text)",
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ChatHeaderProps {
  onClose: () => void;
}

function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="px-4 py-3.5 flex items-center justify-between border-b shrink-0"
      style={{ borderColor: "var(--t-line)" }}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-(--t-accent2) shrink-0">
          <BotIcon />
        </span>
        <h2
          className="truncate uppercase tracking-wide text-sm font-bold"
          style={{ color: "var(--t-text)" }}
        >
          AI Assistant
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors text-lg shrink-0 cursor-pointer active:scale-95"
        style={{ color: "var(--t-dim)" }}
        aria-label="Close chat"
      >
        ✕
      </button>
    </div>
  );
}

/* ─── AIChatDrawer ──────────────────────────────────────────────────────────── */
interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToCart?: () => void;
}

export default function AIChatDrawer({ isOpen, onClose, onGoToCart }: AIChatDrawerProps) {
  const { currencySymbol } = restaurantStore();
  const cartCount = useCartCount();
  const {
    messages,
    loading,
    streaming,
    initialized,
    setMessages,
    addMessage,
    setLoading,
    setInitialized,
    startStreamingMessage,
    appendStreamingText,
    finalizeStreamingMessage,
  } = chatStore();
  const [welcomeText, setWelcomeText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);

  const hasUserMessage = (messages as ChatMessage[]).some((m) => m.role === "user");
  const isBusy = loading || streaming;
  const showWelcomeLayout = messages.length === 0 && !isBusy;

  useEffect(() => {
    if (!isOpen || initialized) return;
    setInitialized(true);

    getChatHistory()
      .then((history: unknown) => {
        if (Array.isArray(history) && history.length > 0) {
          setMessages(
            history.map((m: Record<string, unknown>) => ({
              role: m.role === "user" ? "user" : ("ai" as const),
              text: typeof m.content === "string" ? m.content : String(m.content ?? ""),
              items: Array.isArray(m.recommended_items) ? m.recommended_items : [],
              timestamp: parseChatTimestamp(m),
            })),
          );
          return undefined;
        }
        setMessages([]);
        return getWelcomeMessage();
      })
      .then((welcome: unknown) => {
        if (typeof welcome === "string" && welcome.trim()) {
          setWelcomeText(welcome.trim());
        }
      })
      .catch(() => {
        setMessages([]);
        setWelcomeText("Welcome! I'm here to help you discover delicious food. What are you in the mood for today?");
      });
  }, [isOpen, initialized, setInitialized, setMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showWelcomeLayout]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setInputText(transcript);
      if (e.results[e.results.length - 1].isFinal) {
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
    async (overrideText?: string) => {
      const text = (overrideText ?? inputText ?? "").trim();
      if (!text) return;
      if (text.length > 500) {
        addMessage({
          role: "ai",
          text: "Your message is a bit long — try a shorter question!",
          items: [],
          timestamp: Date.now(),
        });
        return;
      }
      setInputText("");
      addMessage({ role: "user", text, items: [], timestamp: Date.now() });
      setLoading(true);

      let firstChunk = true;

      await streamChatMessage(text, {
        onChunk: (chunk: string) => {
          if (firstChunk) {
            firstChunk = false;
            startStreamingMessage();
          }
          appendStreamingText(chunk);
        },
        onDone: (items?: unknown[], mode?: string, options?: string[]) => {
          finalizeStreamingMessage((items ?? []) as import('../../../types/menu').MenuItem[], mode ?? 'normal', options ?? []);
        },
        onError: () => {
          if (firstChunk) {
            setLoading(false);
            addMessage({
              role: "ai",
              text: "Sorry, I'm having trouble right now. Please try again in a moment.",
              items: [],
              timestamp: Date.now(),
            });
          } else {
            finalizeStreamingMessage([]);
          }
        },
      });
    },
    [
      addMessage,
      setLoading,
      inputText,
      startStreamingMessage,
      appendStreamingText,
      finalizeStreamingMessage,
    ],
  );

  const inputPlaceholder = hasUserMessage ? "Ask follow-up…" : "Ask for suggestions…";

  /* ── Shared chat body ─────────────────────────────────────────────────── */
  const chatBody = (
    <>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 min-h-0">
        {showWelcomeLayout ? (
          <WelcomeScreen welcomeParagraph={welcomeText} onSuggest={send} />
        ) : (
          <div className="space-y-5">
            {(messages as ChatMessage[]).map((m, i) => {
              const isUser = m.role === "user";
              const t = formatMessageTime(m.timestamp);
              const isLatestAi =
                !isUser &&
                i === messages.length - 1 &&
                !m.streaming &&
                !isBusy;
              const showClarifyOptions =
                isLatestAi && m.mode === "clarify" && Array.isArray(m.options) && m.options.length > 0;

              return (
                <div key={i} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
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
                        : "rounded-tl-sm border-l-4",
                    ].join(" ")}
                    style={!isUser ? {
                      background: "var(--t-surface)",
                      color: "var(--t-text)",
                      borderColor: "var(--t-line)",
                      borderLeftColor: "var(--t-accent2)",
                      borderStyle: "solid",
                      borderWidth: "1px",
                      borderLeftWidth: "4px",
                    } : undefined}
                  >
                    {isUser ? (
                      m.text
                    ) : (
                      <>
                        <MarkdownMessage text={m.text} />
                        {m.streaming && (
                          <span
                            className="inline-block w-0.5 h-3.5 ml-0.5 animate-pulse align-middle"
                            style={{ background: "var(--t-accent2)" }}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {t && (
                    <span
                      className="mt-1.5 px-1 uppercase tracking-wide text-xs"
                      style={{ color: "var(--t-dim)", opacity: 0.6 }}
                    >
                      {isUser ? "YOU" : "ASSISTANT"} · {t}
                    </span>
                  )}

                  {!isUser && Array.isArray(m.items) && m.items.length > 0 && (
                    <div className="mt-3 w-full max-w-full space-y-3 pl-0">
                      {(m.items as Array<{ _id?: string; id?: string }>).map((item) => (
                        <MenuItemCard
                          key={item._id ?? item.id}
                          item={item as Parameters<typeof MenuItemCard>[0]['item']}
                          currencySymbol={currencySymbol}
                        />
                      ))}
                    </div>
                  )}

                  {showClarifyOptions && m.options && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => send(opt)}
                          className="px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
                          style={{
                            background: "var(--t-accent2-20)",
                            border: "1px solid var(--t-accent2-40)",
                            color: "var(--t-accent2)",
                          }}
                        >
                          {opt}
                        </button>
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
                  className="px-4 py-3 rounded-2xl rounded-tl-sm border-l-4"
                  style={{
                    background: "var(--t-surface)",
                    borderColor: "var(--t-line)",
                    borderLeftColor: "var(--t-accent2)",
                    borderStyle: "solid",
                    borderWidth: "1px",
                    borderLeftWidth: "4px",
                  }}
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

      <div className="px-4 pt-3 pb-5 border-t shrink-0" style={{ borderColor: "var(--t-line)" }}>
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
            disabled={isBusy}
            className="flex-1 rounded-2xl px-4 py-3 text-sm focus:outline-none transition-colors disabled:opacity-60"
            style={{
              background: "var(--t-float)",
              border: "1.5px solid var(--t-line)",
              color: "var(--t-text)",
            }}
          />
          {SpeechRecognitionAvailable && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={isBusy}
              className={`w-13 h-13 shrink-0 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer text-xl ${
                isListening ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse" : ""
              }`}
              style={!isListening ? {
                background: "var(--t-float)",
                border: "1.5px solid var(--t-line)",
                color: "var(--t-dim)",
              } : undefined}
              title={isListening ? "Stop listening" : "Speak your order"}
            >
              🎙️
            </button>
          )}
          <button
            type="button"
            onClick={() => send()}
            disabled={isBusy}
            className="w-13 h-13 shrink-0 rounded-2xl flex items-center justify-center text-black transition-transform active:scale-[0.97] disabled:opacity-50 cursor-pointer"
            style={{ background: "var(--t-accent)" }}
            aria-label="Send"
          >
            {loading ? (
              <Spinner size="sm" className="border-black/35! border-t-black!" />
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
              disabled={isBusy}
              className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap active:scale-95 transition-transform disabled:opacity-50 shrink-0"
              style={{
                background: "var(--t-float)",
                border: "1px solid var(--t-line)",
                color: "var(--t-dim)",
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {cartCount > 0 && onGoToCart && (
          <button
            type="button"
            onClick={onGoToCart}
            className="w-full mt-3 px-4 py-2.5 rounded-xl flex items-center justify-between text-sm font-semibold transition-all active:scale-[0.98]"
            style={{
              background: "var(--t-accent)",
              color: "#fff",
              boxShadow: "0 4px 16px var(--t-accent-40)",
            }}
          >
            <span>Go to Cart</span>
            <span className="flex items-center gap-1.5">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(0,0,0,0.2)" }}
              >
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </span>
              <span>→</span>
            </span>
          </button>
        )}

        <p className="text-[10px] text-center mt-3 uppercase tracking-widest" style={{ color: "var(--t-dim)", opacity: 0.4 }}>
          {INFRA_FOOTER}
        </p>
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
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px var(--t-accent-20)",
        }}
      >
        <ChatHeader onClose={onClose} />
        {chatBody}
      </div>
    </>
  );
}
