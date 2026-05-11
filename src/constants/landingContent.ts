export interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
  delay: number;
}

export const CHAT_MESSAGES: ChatMessage[] = [
  { from: 'user', text: 'Suggest something spicy under Rs. 500', delay: 0.3 },
  {
    from: 'bot',
    text: "Try our Chicken Chettinad Rs. 420 — bold, fiery, chef's pick. Pair with Garlic Naan Rs. 55 for the perfect bite.",
    delay: 1.2,
  },
  { from: 'user', text: 'Add both and a Mango Lassi', delay: 2.7 },
  {
    from: 'bot',
    text: "Done. That's Rs. 595 total. You've unlocked Happy-Hour 20% off on drinks.",
    delay: 3.6,
  },
];

export interface HeroStat {
  value: string;
  label: string;
}

export const HERO_STATS: HeroStat[] = [
  { value: '10-15%', label: 'Average Order Value' },
  { value: '3×', label: 'Faster Ordering' },
  { value: '40-60%', label: 'Reduced Waiter Workload' },
  { value: '0', label: 'App Downloads' },
];

export interface ProblemCard {
  num: string;
  title: string;
  desc: string;
}

export const PROBLEM_CARDS: ProblemCard[] = [
  {
    num: '01',
    title: "Static menus don't sell",
    desc: 'Paper and QR PDFs deliver zero lift on average order value or attach rate.',
  },
  {
    num: '02',
    title: 'Staff dependency',
    desc: 'Every recommendation relies on waiter memory, mood, and availability.',
  },
  {
    num: '03',
    title: 'Decision fatigue',
    desc: 'Over 60% of guests default to familiar dishes, not the highest-margin ones.',
  },
  {
    num: '04',
    title: 'No customer memory',
    desc: 'Repeat guests are treated as strangers on every visit. No recall. No loyalty.',
  },
];

export interface SolutionBullet {
  label: string;
  desc: string;
}

export const SOLUTION_BULLETS: SolutionBullet[] = [
  {
    label: 'Sells while staff serve',
    desc: 'Every QR scan activates a trained sales representative at the table, independent of floor staff.',
  },
  {
    label: 'Local Language Native',
    desc: 'Designed for Bharat from the ground up — not retrofitted from a Western product.',
  },
  {
    label: 'Persona memory',
    desc: 'Logs individual preferences, dietary choices, and budget signals across every visit.',
  },
  {
    label: 'Live in 24 hours',
    desc: 'No hardware procurement. No staff training. Works on any smartphone, any network.',
  },
];

export interface HowItWorksStep {
  step: string;
  title: string;
  desc: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: '01',
    title: 'Scan',
    desc: 'Guest scans the table QR code. A web app opens instantly — no download, no account required.',
  },
  {
    step: '02',
    title: 'Converse',
    desc: 'The AI assistant guides them by mood, budget, dietary preference, and combo pairing logic.',
  },
  {
    step: '03',
    title: 'Order',
    desc: 'One-tap order confirmation hits the kitchen dashboard in real time. No waiter loop.',
  },
  {
    step: '04',
    title: 'Remember',
    desc: 'The persona engine logs every preference for hyper-personalised future visits.',
  },
];

export interface CapabilityItem {
  letter: string;
  label: string;
  desc: string;
  colorKey: 'orange' | 'cyan' | 'purple';
}

export const CAPABILITY_ITEMS: CapabilityItem[] = [
  {
    letter: 'A',
    label: 'AI Chat Menu',
    desc: 'Natural-language ordering across local native languages — meeting guests where they communicate.',
    colorKey: 'orange',
  },
  {
    letter: 'U',
    label: 'Smart Upselling',
    desc: 'Combo and cross-sell recommendation engine consistently driving 10–20% average order value uplift.',
    colorKey: 'cyan',
  },
  {
    letter: 'D',
    label: 'Live Dashboard',
    desc: 'Real-time menu management — update items, pricing, availability, and promotions in seconds.',
    colorKey: 'purple',
  },
  {
    letter: 'P',
    label: 'Persona Engine',
    desc: 'Persistent guest profiles capturing taste, budget, and dietary history for hyper-personalised service.',
    colorKey: 'orange',
  },
  {
    letter: 'O',
    label: 'Operational Efficiency',
    desc: 'AI-driven self-service reduces floor staff dependency — lowering headcount costs while improving service quality.',
    colorKey: 'cyan',
  },
  {
    letter: '$',
    label: 'POS + Payments',
    desc: 'Native UPI, Razorpay, and POS integrations available on day one — no middleware, no custom dev.',
    colorKey: 'purple',
  },
];

export interface TractionStat {
  label: string;
  value: string;
}

export const TRACTION_STATS: TractionStat[] = [
  { label: 'Deployment time', value: '24 hours' },
  { label: 'Staff retraining', value: 'None required' },
  { label: 'Hardware changes', value: 'Zero' },
];
