import React from 'react';
import { restaurantStore } from '../store/restaurantStore';
import { cartStore } from '../store/cartStore';
import { CountBadge } from '../components/ui/Badge';
import Text from '../components/ui/Text';

/**
 * Customer-facing top header.
 * @param {{ onCartClick: () => void }} props
 */
export default function Header({ onCartClick }) {
  const { name, tagline }   = restaurantStore();
  const { count }           = cartStore();

  const title = name || 'Dynamu Smart Menu';
  const sub   = tagline || 'Table 05 • Royal Cafe';

  return (
    <header className="px-5 py-4 flex justify-between items-center bg-white/5 backdrop-blur-md border-b border-white/10">
      <div>
        <Text
          as="h1"
          size="lg"
          weight="bold"
          className="bg-gradient-to-r from-brand to-orange-400 bg-clip-text text-transparent"
        >
          {title}
        </Text>
        <Text size="xs" color="muted" className="mt-0.5">{sub}</Text>
      </div>

      <button
        onClick={onCartClick}
        className="relative cursor-pointer active:scale-90 transition-transform"
        aria-label={`View cart${count > 0 ? ` — ${count} items` : ''}`}
      >
        <span className="text-2xl">🛒</span>
        <CountBadge count={count} />
      </button>
    </header>
  );
}
