import { useEffect, useRef } from 'react';

export function ParallaxSection({
  imageUrl,
  overlay,
  children,
  className = '',
  minHeight,
  disableParallax = false,
  id,
}) {
  const sectionRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (disableParallax) return;
    let raf = null;
    const tick = () => {
      if (!sectionRef.current || !imgRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const centerDelta = rect.top + rect.height / 2 - window.innerHeight / 2;
      imgRef.current.style.transform = `translateY(${centerDelta * 0.22}px)`;
    };
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    tick();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [disableParallax]);

  return (
    <section
      id={id}
      ref={sectionRef}
      className={`relative overflow-hidden flex flex-col ${className}`}
      style={minHeight != null ? { minHeight } : undefined}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute w-full object-cover will-change-transform pointer-events-none select-none"
        style={{ top: '-8%', height: '116%' }}
      />
      <div className="absolute inset-0" style={{ background: overlay }} />
      <div className="relative z-10 flex-1 flex flex-col justify-center min-h-0 w-full">{children}</div>
    </section>
  );
}
