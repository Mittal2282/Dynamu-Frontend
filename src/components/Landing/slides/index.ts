import { CapabilitiesSlide } from './CapabilitiesSlide';
import { CtaSlide } from './CtaSlide';
// FooterSlide is commented out — embedded simple footer is now inside CtaSlide.
// import { FooterSlide } from './FooterSlide';
import { HeroSlide } from './HeroSlide';
import { HowItWorksSlide } from './HowItWorksSlide';
import { ProblemSlide } from './ProblemSlide';
import { SolutionSlide } from './SolutionSlide';
/** Ordered deck — length drives dots, keyboard bounds, and transform steps. */
export const SLIDE_COMPONENTS = [
  HeroSlide,
  ProblemSlide,
  SolutionSlide,
  HowItWorksSlide,
  CapabilitiesSlide,
  CtaSlide,
];
