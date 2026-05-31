import { ORANGE } from '../../constants/landingConstants';

export interface LandingNavProps {
  onAdminLogin?: () => void;
}

export function LandingNav({ onAdminLogin }: LandingNavProps) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b pointer-events-auto"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        borderColor: 'rgba(0,0,0,0.08)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm"
            style={{ background: ORANGE, color: '#fff' }}
          >
            D
          </div>
          <span className="text-[15px] sm:text-[17px] font-bold tracking-tight" style={{ color: '#111827' }}>
            Dynamu<span style={{ color: ORANGE }}>.AI</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onAdminLogin}
          className="text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 rounded-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
          style={{ background: ORANGE, color: '#fff' }}
        >
          Admin Login
        </button>
      </div>
    </nav>
  );
}
