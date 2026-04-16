import Text from "../../../components/ui/Text";
import Button from "../../../components/ui/Button";

/**
 * CartBar — fixed mobile bottom bar showing cart item count with "View Cart" CTA.
 */
export default function CartBar({ count, onViewCart }) {
  if (count === 0) return null;

  return (
    <div className="md:hidden fixed bottom-[95px] left-0 right-0 z-30 flex justify-center px-4">
      <div className="w-full bg-brand rounded-2xl px-5 py-4 flex items-center justify-between shadow-2xl shadow-[var(--t-accent-40)]">
        <div>
          <Text size="md" weight="bold">
            {count} {count === 1 ? "item" : "items"} added
          </Text>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={onViewCart}
          className="!bg-white !text-brand font-bold"
        >
          View Cart →
        </Button>
      </div>
    </div>
  );
}
