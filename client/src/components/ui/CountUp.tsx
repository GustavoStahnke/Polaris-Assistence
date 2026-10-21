import { animate } from 'motion';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../stores/uiStore';

/** Número que sobe animado até o valor final. */
export function CountUp({
  value,
  decimals = 0,
  duration = 0.9,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const format = (n: number) =>
      n.toLocaleString('pt-BR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
    if (reduced) {
      node.textContent = format(value);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, decimals, duration, reduced]);

  return <span ref={ref} className={className} />;
}
