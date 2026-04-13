import { BORDER, ORANGE } from '../../../constants/landingConstants';

export function FooterSlide() {
  return (
    <footer className="border-t min-h-[100dvh] w-full flex flex-col justify-center shrink-0" style={{ borderColor: BORDER }}>
      <div className="max-w-6xl mx-auto px-6 py-10 w-full flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center font-black text-xs"
            style={{ background: ORANGE, color: '#fff' }}
          >
            D
          </div>
          <span className="font-bold text-white text-sm">
            Dynamu<span style={{ color: ORANGE }}>.AI</span>
          </span>
          <span className="text-[10px] font-medium text-slate-400 ml-1 hidden sm:inline">
            Vertical AI · HoReCa · Bharat First
          </span>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-400">
          <a href="https://x.com/bhavyam" target="_blank" rel="noreferrer" className="hover:text-slate-200 transition-colors">
            X · @bhavyam
          </a>
          <span>·</span>
          <a href="mailto:founder@dynamu.ai" className="hover:text-slate-200 transition-colors">
            founder@dynamu.ai
          </a>
          <span>·</span>
          <span className="text-slate-500">dynamu.ai</span>
        </div>

        <p className="text-[11px] text-slate-500">© Dynamu AI · 2026</p>
      </div>
    </footer>
  );
}
