export function SlideFrame({ children, className = '', align = 'center' }) {
  const alignClass =
    align === 'start' ? 'justify-start' : align === 'end' ? 'justify-end' : 'justify-center';
  return (
    <div className={`h-dvh w-full shrink-0 flex flex-col overflow-hidden box-border ${className}`}>
      <div
        data-slide-scroll
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain"
      >
        <div className={`min-h-[100dvh] w-full flex flex-col ${alignClass} box-border`}>{children}</div>
      </div>
    </div>
  );
}
