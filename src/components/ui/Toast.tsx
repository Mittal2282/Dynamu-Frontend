import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Alert } from 'antd';

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

const ToastContext = createContext<ToastFn | null>(null);

function ToastItemComponent({ id, status = 'info', title, description, onDismiss }: ToastItem & { onDismiss: (id: number) => void }) {
  return (
    <Alert
      type={status}
      message={title}
      description={description}
      closable
      onClose={() => onDismiss(id)}
      showIcon
      className="shadow-2xl animate-[fadeSlideIn_0.25s_ease-out] w-full"
    />
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
