import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── Types ────────────────────────────────────────────────────────────────────
const ICONS = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️',
};

const BG = {
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  error:   'border-red-500/30 bg-red-500/10 text-red-400',
  info:    'border-blue-500/30 bg-blue-500/10 text-blue-300',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
};

// ─── Toast Item ───────────────────────────────────────────────────────────────
function ToastItem({ id, status = 'info', title, description, onDismiss }) {
  return (
    <div
      role="alert"
      className={[
        'relative flex items-start gap-3 rounded-2xl border px-4 py-3',
        'shadow-2xl backdrop-blur-xl w-full max-w-sm',
        'animate-[fadeSlideIn_0.25s_ease-out]',
        BG[status] ?? BG.info,
      ].join(' ')}
    >
      <span className="text-lg shrink-0 mt-0.5">{ICONS[status]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        {description && (
          <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ status = 'info', title, description, duration = 3000 }) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, status, title, description }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Portal-style stack — fixed top-right */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Returns the toast dispatch function.
 * toast({ status, title, description?, duration? })
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
