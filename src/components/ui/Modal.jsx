import React, { useEffect } from 'react';

/**
 * Common accessible Modal component that applies a backdrop and body scroll lock.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: function,
 *   title?: string,
 *   children: React.ReactNode,
 *   maxWidth?: string
 * }} props
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-sm',
}) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} rounded-2xl shadow-2xl flex flex-col`}
        style={{
          background: 'var(--t-bg)',
          borderTop: '2.5px solid var(--t-accent)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
            {title && (
              <h3 className="text-white font-bold text-lg leading-none tracking-wide">
                {title}
              </h3>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 -mr-2 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors text-lg cursor-pointer active:scale-95"
                aria-label="Close modal"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
