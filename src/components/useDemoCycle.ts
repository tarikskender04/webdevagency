import { useEffect, useRef, useState, type RefObject } from 'react';
export function useDemoCycle(length: number, delay = 2800): { ref: RefObject<HTMLDivElement | null>; phase: number; choose: (phase: number) => void } {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const [manual, setManual] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || manual) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setInterval> | undefined;
    let visible = false;
    const sync = (): void => { clearInterval(timer); if (visible && !document.hidden && !motion.matches) timer = setInterval(() => setPhase(p => (p + 1) % length), delay); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .2 });
    observer.observe(element);
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return (): void => { clearInterval(timer); observer.disconnect(); motion.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); };
  }, [length, delay, manual]);
  return { ref, phase, choose: (next: number): void => { setManual(true); setPhase(next); } };
}
