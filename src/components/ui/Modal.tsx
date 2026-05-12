import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-sm' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isOpen) el.showModal();
    else if (el.open) el.close();
  }, [isOpen]);

  return (
    <dialog ref={ref} className="modal" onClose={onClose}>
      <div
        className={`modal-box ${maxWidth} p-0 flex flex-col max-h-[90vh]`}
        style={{ background: 'var(--t-bg)', borderTop: '2.5px solid var(--t-accent)' }}
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--t-line)' }}
        >
          {title && (
            <h3 className="font-bold text-lg leading-none tracking-wide" style={{ color: 'var(--t-text)' }}>
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle ml-auto"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="p-5 flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose} />
      </form>
    </dialog>
  );
}
