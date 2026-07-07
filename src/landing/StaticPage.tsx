import Sections from './Sections';

// Reduced-motion / low-end fallback: identical copy and structure, no WebGL,
// no GSAP — each act gets its Higgsfield plate as a plain CSS background.
export default function StaticPage() {
  return (
    <div className="dyn-static">
      <Sections />
    </div>
  );
}
