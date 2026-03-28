/**
 * Reusable bottom-sheet Drawer component.
 * Used by CartDrawer and AIChatDrawer.
 *
 * @param {{ isOpen: boolean, onClose: () => void, children: ReactNode, maxHeight?: string }} props
 */
export default function Drawer({ isOpen, onClose, children, maxHeight = '85vh' }) {
  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        className={[
          'fixed inset-0 bg-black/60 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-50 flex justify-center',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
      >
        <div
          className="w-full max-w-md bg-slate-900 rounded-t-3xl flex flex-col shadow-2xl"
          style={{ maxHeight }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0" aria-hidden>
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>
          {children}
        </div>
      </div>
    </>
  );
}
