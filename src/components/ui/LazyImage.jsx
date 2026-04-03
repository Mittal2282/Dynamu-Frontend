import { useEffect, useRef, useState } from 'react';

export default function LazyImage({
  src,
  alt,
  containerClassName = '',
  imgClassName = 'w-full h-full object-cover',
  placeholder = null,
  rootMargin = '200px',
  disabled = false,
}) {
  const hostRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (disabled) {
      setShouldLoad(true);
      return;
    }

    if (!src) {
      // No image: keep placeholder only (no network request).
      setShouldLoad(false);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const el = hostRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) {
          setShouldLoad(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [src, disabled, rootMargin]);

  return (
    <div ref={hostRef} className={containerClassName}>
      {shouldLoad && src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          referrerPolicy="no-referrer"
          className={imgClassName}
        />
      ) : (
        placeholder ?? (
          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-slate-400 px-1 text-center">
              No image available
            </span>
          </div>
        )
      )}
    </div>
  );
}

