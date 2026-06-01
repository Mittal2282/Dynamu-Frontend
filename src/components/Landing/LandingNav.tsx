import { ORANGE } from '../../constants/landingConstants';
import DynamuLogo from '../../assets/DynamuLogo.png';

export interface LandingNavProps {
  onAdminLogin?: () => void;
}

export function LandingNav({ onAdminLogin }: LandingNavProps) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b-2 pointer-events-auto"
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        borderColor: '#000',
      }}
    >
      <div className="w-full px-6 sm:px-10 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={DynamuLogo}
            alt="DynamuAI"
            className="h-8 sm:h-10 w-auto object-contain rounded-full"
          />
          <span className="text-[16px] sm:text-[18px] font-bold tracking-tight" style={{ color: '#111827' }}>
            Dynamu<span style={{ color: ORANGE }}>AI</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onAdminLogin}
          className="text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 rounded-lg transition-all duration-150 hover:opacity-80 active:scale-[0.98]"
          style={{ background: '#111827', color: '#fff' }}
        >
          Admin Login
        </button>
      </div>
    </nav>
  );
}
