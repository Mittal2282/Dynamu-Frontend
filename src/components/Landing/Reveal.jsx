import { useRef, useEffect, useState } from 'react';

function useInView(ref, threshold = 0.12) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

export function Reveal({
  children,
  animation = 'revealUp',
  delay = 0,
  threshold = 0.12,
  as = 'div',
  className = '',
  style = {},
}) {
  const ref = useRef(null);
  const inView = useInView(ref, threshold);
  const Root = as;
  return (
    <Root
      ref={ref}
      className={className}
      style={{
        ...style,
        ...(inView
          ? { animation: `${animation} 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}s both` }
          : { opacity: 0 }),
      }}
    >
      {children}
    </Root>
  );
}
