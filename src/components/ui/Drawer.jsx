import { useEffect, useRef, useState } from 'react';

/**
 * Reusable bottom-sheet Drawer.
 *
 * Features
 *  - Dynamic brand-coloured top border (via CSS var)
 *  - Drag-handle + touch/mouse swipe-down-to-close gesture
 *  - Rounded top corners, dark surface, backdrop blur overlay
 *
 * @param {{ isOpen: boolean, onClose: () => void, children: ReactNode, maxHeight?: string }} props
 */
export default function Drawer({ isOpen, onClose, children, maxHeight = '90vh', height }) {
  const sheetRef   = useRef(null);
  const handleRef  = useRef(null);
  const startY     = useRef(null);
  const currentY   = useRef(0);
  const [dragging, setDragging] = useState(false);

  /* ── Swipe-down gesture ──────────────────────────────────────────────────── */
  const onPointerDown = (e) => {
    startY.current  = e.clientY ?? e.touches?.[0]?.clientY;
    currentY.current = 0;
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e) => {
      const y = (e.clientY ?? e.touches?.[0]?.clientY) - startY.current;
      currentY.current = Math.max(0, y); // only drag downward
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
      }
    };

    const onUp = () => {
      setDragging(false);
      if (sheetRef.current) {
        sheetRef.current.style.transform = '';
      }
      // If dragged more than 120px → close
      if (currentY.current > 120) onClose();
    };

    window.addEventListener('mousemove',  onMove);
    window.addEventListener('touchmove',  onMove, { passive: true });
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchend',  onUp);
    return () => {
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchend',  onUp);
    };
  }, [dragging, onClose]);

  /* ── Lock body scroll when open ─────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        className={[
          'fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-50 flex justify-center',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
      >
        <div
          ref={sheetRef}
          className="w-full max-w-md flex flex-col shadow-2xl"
          style={{
            maxHeight,
            height: height || 'auto',
            background: 'var(--t-bg)',
            borderRadius: '24px 24px 0 0',
            borderTop: '2.5px solid var(--t-accent)',
            transition: dragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {/* ── Drag handle ────────────────────────────────────────────────── */}
          <div
            ref={handleRef}
            onMouseDown={onPointerDown}
            onTouchStart={onPointerDown}
            className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing select-none"
            aria-label="Drag to close"
          >
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: 'var(--t-accent)', opacity: 0.5 }}
            />
          </div>

          {/* ── Content ────────────────────────────────────────────────────── */}
          {children}
        </div>
      </div>
    </>
  );
}
