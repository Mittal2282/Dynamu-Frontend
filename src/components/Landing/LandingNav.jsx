import { BORDER, ORANGE } from '../../constants/landingConstants';

export function LandingNav({ onAdminLogin }) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b pointer-events-auto"
      style={{
        background: 'rgba(10,12,16,0.82)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        borderColor: BORDER,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: ORANGE, color: '#fff' }}
          >
            D
          </div>
          <span className="text-[17px] font-bold tracking-tight">
            Dynamu<span style={{ color: ORANGE }}>.AI</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onAdminLogin}
          className="text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
          style={{ background: ORANGE, color: '#fff' }}
        >
          Admin Login
        </button>
      </div>
    </nav>
  );
}
