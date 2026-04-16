import { useCallback, useEffect, useRef, useState } from 'react';
import { SLIDE_LOCK_MS } from '../constants/landingConstants';

export function useSlideDeck(slideCount) {
  const viewportRef = useRef(null);
  const lockRef = useRef(false);
  const indexRef = useRef(0);
  const touchStartY = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    indexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const armLock = useCallback(() => {
    lockRef.current = true;
    window.setTimeout(() => {
      lockRef.current = false;
    }, SLIDE_LOCK_MS);
  }, []);

  const goToSlide = useCallback(
    (i) => {
      if (lockRef.current) return;
      const next = Math.max(0, Math.min(slideCount - 1, i));
      if (indexRef.current === next) return;
      armLock();
      setActiveIndex(next);
    },
    [armLock, slideCount]
  );

  const stepSlide = useCallback(
    (delta) => {
      if (lockRef.current) return;
      const prev = indexRef.current;
      const next = Math.max(0, Math.min(slideCount - 1, prev + delta));
      if (next === prev) return;
      armLock();
      setActiveIndex(next);
    },
    [armLock, slideCount]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        stepSlide(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        stepSlide(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(slideCount - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepSlide, goToSlide, slideCount]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < 10) return;
      const scrollEl = e.target instanceof Element ? e.target.closest('[data-slide-scroll]') : null;
      if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 2) {
        const top = scrollEl.scrollTop;
        const max = scrollEl.scrollHeight - scrollEl.clientHeight;
        const atTop = top <= 0;
        const atBottom = top >= max - 1;
        if (e.deltaY > 0 && !atBottom) return;
        if (e.deltaY < 0 && !atTop) return;
      }
      e.preventDefault();
      stepSlide(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [stepSlide]);

  const onTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      if (touchStartY.current == null) return;
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      touchStartY.current = null;
      if (Math.abs(dy) < 56) return;
      stepSlide(dy > 0 ? 1 : -1);
    },
    [stepSlide]
  );

  return {
    viewportRef,
    activeIndex,
    reduceMotion,
    goToSlide,
    stepSlide,
    onTouchStart,
    onTouchEnd,
  };
}
