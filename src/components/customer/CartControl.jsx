import { cartStore } from '../../store/cartStore';
import Button from '../ui/Button';
import Text from '../ui/Text';

export default function CartControl({ item }) {
  const { add, remove, getQty } = cartStore();
  const q = getQty(item._id);

  if (q === 0) {
    return (
      <Button size="sm" onClick={() => add(item)} className="tracking-wider">
        ADD
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => remove(item)}
        className="w-7 h-7 rounded-full bg-[var(--color-brand-primary)] text-white font-bold flex items-center justify-center active:scale-95 transition-transform"
      >
        −
      </button>
      <Text as="span" size="sm" weight="bold" className="w-4 text-center">{q}</Text>
      <button
        onClick={() => add(item)}
        className="w-7 h-7 rounded-full bg-[var(--color-brand-primary)] text-white font-bold flex items-center justify-center active:scale-95 transition-transform"
      >
        +
      </button>
    </div>
  );
}
