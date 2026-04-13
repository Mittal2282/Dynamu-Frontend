import { useRef } from 'react';
import { useLandingInView } from '../../hooks/useLandingInView';

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
  const inView = useLandingInView(ref, threshold);
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
