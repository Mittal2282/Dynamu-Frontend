import { ORANGE } from '../../constants/landingConstants';

export function Eyebrow({ children, light = false }) {
  return (
    <p
      className="text-[11px] font-bold uppercase tracking-[0.24em] mb-3"
      style={{ color: light ? 'rgba(255,107,0,0.95)' : ORANGE }}
    >
      {children}
    </p>
  );
}
