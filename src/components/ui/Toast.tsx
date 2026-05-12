import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

interface ToastOptions {
  status?: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

type ToastFn = (options: ToastOptions) => void;

const ICONS: Record<string, string> = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️',
};

const ALERT_CLASS: Record<string, string> = {
  success: 'alert-success',
  error:   'alert-error',
  info:    'alert-info',
  warning: 'alert-warning',
};

const ToastContext = createContext<ToastFn | null>(null);

function ToastItemComponent({ id, status = 'info', title, description, onDismiss }: ToastItem & { onDismiss: (id: number) => void }) {
  return (
    <div
      role="alert"
      className={`alert ${ALERT_CLASS[status] ?? ALERT_CLASS.info} shadow-2xl w-full max-w-sm animate-[fadeSlideIn_0.25s_ease-out]`}
    >
      <span className="text-lg shrink-0">{ICONS[status]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        {description && <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="btn btn-ghost btn-xs btn-circle shrink-0"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastFn>(({ status = 'info', title, description, duration = 3000 }) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, status, title, description }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4"
      >
        {toasts.map((t) => (
          <ToastItemComponent key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
